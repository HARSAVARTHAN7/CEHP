import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { MOCK_USERS } from '../utils/mockData';
import { login, getMe } from '../controllers/authController';
import {
  approveResult,
  publishResult,
  publishExaminationResult,
  correctResult,
  deleteResult,
} from '../controllers/resultController';
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createSubject,
  updateSubject,
  deleteSubject,
  createExamination,
  deleteExamination,
} from '../controllers/academicController';
import {
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import {
  calculateGrade,
  determineResultStatus,
  calculateSGPA,
  getDefaultGradeThresholds,
} from '../services/academicCalculation';
import { authorize, authenticate } from '../middleware/auth';

describe('RBAC, HOD Authentication, and Authoritative Publication Tests', () => {
  // Test 1: HOD Authentication and role assignment
  it('correctly authenticates HOD and provisions HOD role with assigned department', async () => {
    const app = express();
    app.use(express.json());
    app.post('/api/v1/auth/login', login);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'hod.cse@cehp.edu', password: 'Demo@1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('HOD');
    expect(res.body.data.email).toBe('hod.cse@cehp.edu');
    expect(res.body.data.assignedDepartmentIds).toContain('dept_cse');
  });

  // Test 2: HOD publication attempt is blocked with HTTP 403 Forbidden
  it('strictly rejects HOD publication attempts with HTTP 403 Forbidden (Non-Negotiable Policy)', async () => {
    const app = express();
    app.use(express.json());

    // Inject mock auth middleware representing authenticated HOD
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_hod';
      req.userRole = 'HOD';
      req.userEmail = 'hod.cse@cehp.edu';
      next();
    });

    app.post('/api/v1/results/:id/publish', authorize('EXAM_OFFICER', 'ADMIN'), publishResult);
    app.post('/api/v1/examinations/:examinationId/publish-results', authorize('EXAM_OFFICER', 'ADMIN'), publishExaminationResult);
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });

    // Single result publish attempt
    const res1 = await request(app).post('/api/v1/results/res-101/publish');
    expect(res1.status).toBe(403);
    expect(res1.body.message).toMatch(/Forbidden|Only.*can publish/i);

    // Examination cycle bulk publish attempt
    const res2 = await request(app).post('/api/v1/examinations/exam-2025/publish-results');
    expect(res2.status).toBe(403);
    expect(res2.body.message).toMatch(/Forbidden|Only.*can publish/i);
  });

  // Test 3: Authorized Exam Officer and Admin CAN publish results
  it('permits authorized Examination Officer and Administrator to publish results', async () => {
    // Test Exam Officer
    const examApp = express();
    examApp.use(express.json());
    examApp.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_exam';
      req.userRole = 'EXAM_OFFICER';
      req.userEmail = 'controller@cehp.edu';
      next();
    });
    examApp.post('/api/v1/results/:id/publish', authorize('EXAM_OFFICER', 'ADMIN'), publishResult);
    examApp.post('/api/v1/examinations/:examinationId/publish-results', authorize('EXAM_OFFICER', 'ADMIN'), publishExaminationResult);

    const resExam = await request(examApp).post('/api/v1/results/res-101/publish');
    expect(resExam.status).toBe(200);
    expect(resExam.body.success).toBe(true);

    const resExamBulk = await request(examApp).post('/api/v1/examinations/exam-2025/publish-results');
    expect(resExamBulk.status).toBe(200);
    expect(resExamBulk.body.success).toBe(true);

    // Test Admin
    const adminApp = express();
    adminApp.use(express.json());
    adminApp.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_admin';
      req.userRole = 'ADMIN';
      req.userEmail = 'admin@cehp.edu';
      next();
    });
    adminApp.post('/api/v1/results/:id/publish', authorize('EXAM_OFFICER', 'ADMIN'), publishResult);

    const resAdmin = await request(adminApp).post('/api/v1/results/res-101/publish');
    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.success).toBe(true);
  });

  // Test 4: HOD departmental review and approval
  it('allows HOD to approve departmental results without triggering official publication', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_hod';
      req.userRole = 'HOD';
      req.userEmail = 'hod.cse@cehp.edu';
      next();
    });

    app.post('/api/v1/results/:id/approve', authorize('HOD', 'EXAM_OFFICER', 'ADMIN'), approveResult);

    const res = await request(app)
      .post('/api/v1/results/res-101/approve')
      .send({ reason: 'Department marks verified and verified by HOD' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.publicationStatus).toBe('APPROVED');
    // Crucial: Approval MUST NOT transition to PUBLISHED
    expect(res.body.data.publicationStatus).not.toBe('PUBLISHED');
  });

  // Test 5: Administrator Dedicated Result Correction Workflow
  it('executes validated and audited result corrections by Administrator', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_admin';
      req.userRole = 'ADMIN';
      req.userEmail = 'admin@cehp.edu';
      next();
    });

    app.post('/api/v1/results/:id/correct', authorize('ADMIN', 'EXAM_OFFICER'), correctResult);
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });

    // 1. Missing reason must be rejected with 400
    const failRes = await request(app)
      .post('/api/v1/results/res-202/correct')
      .send({ internalMarks: 39, externalMarks: 53 });
    expect(failRes.status).toBe(400);

    // 2. Valid correction: recalculates totalMarks, grade, and gradePoint
    const successRes = await request(app)
      .post('/api/v1/results/res-202/correct')
      .send({
        reason: 'Recounting of external script Section B question 4',
        internalMarks: 38,
        externalMarks: 56, // total 94 -> 'O' grade (gradePoint 10)
      });

    expect(successRes.status).toBe(200);
    expect(successRes.body.success).toBe(true);
    expect(successRes.body.data.totalMarks).toBe(94);
    expect(successRes.body.data.grade).toBe('O');
    expect(successRes.body.data.gradePoint).toBe(10);
    expect(successRes.body.data.isCorrection).toBe(true);
    expect(successRes.body.data.correctionReason).toBe('Recounting of external script Section B question 4');
  });

  // Test 6: Administrator Academic Configuration CRUD operations
  it('provides complete authorized CRUD across departments, subjects, and examinations', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_admin';
      req.userRole = 'ADMIN';
      next();
    });

    app.post('/api/v1/departments', authorize('ADMIN'), createDepartment);
    app.patch('/api/v1/departments/:id', authorize('ADMIN'), updateDepartment);
    app.delete('/api/v1/departments/:id', authorize('ADMIN'), deleteDepartment);

    app.post('/api/v1/subjects', authorize('ADMIN', 'EXAM_OFFICER'), createSubject);
    app.delete('/api/v1/subjects/:id', authorize('ADMIN', 'EXAM_OFFICER'), deleteSubject);

    app.post('/api/v1/examinations', authorize('ADMIN', 'EXAM_OFFICER'), createExamination);
    app.delete('/api/v1/examinations/:id', authorize('ADMIN', 'EXAM_OFFICER'), deleteExamination);

    // Department CRUD
    const createDept = await request(app).post('/api/v1/departments').send({ name: 'Data Science', code: 'AIDS' });
    expect(createDept.status).toBe(201);

    const updateDept = await request(app).patch('/api/v1/departments/dept_1').send({ name: 'Advanced Data Science' });
    expect(updateDept.status).toBe(200);

    const deleteDept = await request(app).delete('/api/v1/departments/dept_1');
    expect(deleteDept.status).toBe(200);

    // Subject CRUD
    const createSub = await request(app).post('/api/v1/subjects').send({ code: 'AI501', name: 'Machine Learning', credits: 4 });
    expect(createSub.status).toBe(201);

    const deleteSub = await request(app).delete('/api/v1/subjects/sub_1');
    expect(deleteSub.status).toBe(200);

    // Examination CRUD
    const createExam = await request(app).post('/api/v1/examinations').send({ name: 'Dec 2026 Finals' });
    expect(createExam.status).toBe(201);

    const deleteExam = await request(app).delete('/api/v1/examinations/exam_1');
    expect(deleteExam.status).toBe(200);
  });

  // Test 7: Administrator User Management CRUD
  it('allows Administrator to create, update, and delete user identities', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_admin';
      req.userRole = 'ADMIN';
      next();
    });

    app.post('/api/v1/users', authorize('ADMIN'), createUser);
    app.patch('/api/v1/users/:id', authorize('ADMIN'), updateUser);
    app.delete('/api/v1/users/:id', authorize('ADMIN'), deleteUser);

    const createRes = await request(app).post('/api/v1/users').send({
      name: 'Dr. New Faculty',
      email: 'newfaculty@cehp.edu',
      role: 'FACULTY',
    });
    expect(createRes.status).toBe(201);

    const updateRes = await request(app).patch('/api/v1/users/usr_new').send({
      accountStatus: 'SUSPENDED',
    });
    expect(updateRes.status).toBe(200);

    const deleteRes = await request(app).delete('/api/v1/users/usr_new');
    expect(deleteRes.status).toBe(200);
  });
});
