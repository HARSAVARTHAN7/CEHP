import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { connectDB } from '../config/database';

describe('HTTP 500 Diagnostics, Prevention & Real-Time Records Retrieval', () => {
  let studentToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await connectDB();

    // Authenticate student
    const studentRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'student1@cehp.edu', password: 'Demo@1234' });

    expect(studentRes.status).toBe(200);
    studentToken = studentRes.body.accessToken;

    // Authenticate admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@cehp.edu', password: 'Demo@1234' });

    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.accessToken;
  });

  afterAll(async () => {
    // Keep connection clean
  });

  it('1. Verifies database connection is active and healthy', () => {
    expect(mongoose.connection.readyState).toBe(1);
  });

  it('2. Authenticated student retrieves genuine real-time academic analytics (200 OK, no 500)', async () => {
    const res = await request(app)
      .get('/api/v1/results/my-analytics')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.cgpa).toBeGreaterThan(0);
    expect(Array.isArray(res.body.data.semesterSGPAs)).toBe(true);
  });

  it('3. Authenticated student retrieves genuine examination history (200 OK, no 500)', async () => {
    const res = await request(app)
      .get('/api/v1/results/my-history')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.records.length).toBeGreaterThan(0);
    expect(res.body.data.activeArrearsCount).toBeDefined();
  });

  it('4. Authenticated student retrieves genuine arrears status (200 OK, no 500)', async () => {
    const res = await request(app)
      .get('/api/v1/results/my-arrears')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeArrearsCount).toBeDefined();
    expect(Array.isArray(res.body.data.activeArrears)).toBe(true);
  });

  it('5. Safe error handling: Malformed MongoDB ObjectId returns 400 with INVALID_IDENTIFIER, not 500', async () => {
    const res = await request(app)
      .get('/api/v1/examinations/not-a-valid-object-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_IDENTIFIER');
    expect(res.body.requestId).toBeDefined();
  });

  it('6. Safe error handling: Unauthorized student cannot access admin routes (403, not 500)', async () => {
    const res = await request(app)
      .get('/api/v1/results/audit-integrity')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('7. Safe error handling: Unauthenticated request is rejected with 401, not 500', async () => {
    const res = await request(app)
      .get('/api/v1/results/my-analytics')
      .set('Authorization', 'Bearer invalid-token-string');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_TOKEN');
    expect(res.body.requestId).toBeDefined();
  });

  it('8. Safe error handling: Non-existent route returns 404, not 500', async () => {
    const res = await request(app)
      .get('/api/v1/non-existent-endpoint')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('9. AI performance summary executes against real database records without 500', async () => {
    const res = await request(app)
      .post('/api/v1/ai/performance-summary')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.overallCGPA).toBeDefined();
    expect(res.body.data.performanceTrend).toBeDefined();
  });

  it('10. AI Chat returns intelligent CBCS academic advice grounded in real records', async () => {
    const res = await request(app)
      .post('/api/v1/ai/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'What is my current CGPA?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBeDefined();
  });
});
