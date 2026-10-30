import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app';
import { connectDB } from '../config/database';
import mongoose from 'mongoose';

describe('Real-Time Academic Records & Authentication Verification', () => {
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
  }, 30000);

  afterAll(async () => {
    // Keep connection or close
  });

  it('1. Successfully authenticates real student and issues signed JWT', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@cehp.edu', password: 'Demo@1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('student1@cehp.edu');
    expect(res.body.data.role).toBe('STUDENT');
    expect(res.body.accessToken).toBeDefined();
    expect(typeof res.body.accessToken).toBe('string');
    studentToken = res.body.accessToken;
  }, 30000);

  it('2. Authenticates admin to verify role separation', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cehp.edu', password: 'Demo@1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('ADMIN');
    adminToken = res.body.accessToken;
  });

  it('3. Rejects fake or malformed demo token with HTTP 401', async () => {
    const res = await request(app)
      .get('/api/v1/results/my-analytics')
      .set('Authorization', 'Bearer demo_token_student');

    expect(res.status).toBe(401);
  });

  it('4. Rejects request with missing token with HTTP 401', async () => {
    const res = await request(app)
      .get('/api/v1/results/my-analytics');

    expect(res.status).toBe(401);
  });

  it('5. Retrieves genuine student academic analytics from MongoDB for authenticated student', async () => {
    const res = await request(app)
      .get('/api/v1/results/my-analytics')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const data = res.body.data;

    // Genuine student fields from database
    expect(data.registrationNumber).toBe('212222040001');
    expect(data.batch).toBe('2022-2026');
    expect(data.currentSemester).toBe(5);
    expect(typeof data.cgpa).toBe('number');
    expect(data.cgpa).toBeGreaterThan(0);
    expect(typeof data.latestSGPA).toBe('number');
    expect(data.totalSubjectsPassed).toBeGreaterThan(0);
    expect(Array.isArray(data.semesterSGPAs)).toBe(true);
    expect(data.semesterSGPAs.length).toBeGreaterThan(0);
  });

  it('6. Retrieves genuine semester examination history records from MongoDB', async () => {
    const res = await request(app)
      .get('/api/v1/results/my-history')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const records = res.body.data.records;
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(17);

    // Verify populated fields
    const firstRecord = records[0];
    expect(firstRecord.subjectId).toBeDefined();
    expect(firstRecord.subjectId.code).toBeDefined();
    expect(firstRecord.subjectId.name).toBeDefined();
    expect(firstRecord.semesterId).toBeDefined();
    expect(firstRecord.totalMarks).toBeDefined();
    expect(firstRecord.grade).toBeDefined();
    expect(firstRecord.resultStatus).toBe('PASS');
    expect(firstRecord.publicationStatus).toBe('PUBLISHED');
  });

  it('7. Enforces student data isolation: Student cannot access administrative arrears endpoint', async () => {
    const fakeStudentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .get(`/api/v1/students/${fakeStudentId}/arrears`)
      .set('Authorization', `Bearer ${studentToken}`);

    // Forbidden for student role
    expect(res.status).toBe(403);
  });

  it('8. Retrieves authoritative arrear summary matching DB records', async () => {
    const res = await request(app)
      .get('/api/v1/results/my-arrears')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeArrearsCount).toBe(0);
    expect(Array.isArray(res.body.data.activeArrears)).toBe(true);
  });
});
