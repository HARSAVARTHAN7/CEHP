import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import {
  calculateStudentArrears,
  determineResultStatus,
  calculateGrade,
  getDefaultGradeThresholds,
} from '../services/academicCalculation';
import {
  getMyHistory,
  getMyAnalytics,
  getMyArrears,
  getStudentArrears,
  auditAcademicIntegrity,
  reconcileArrears,
  correctResult,
} from '../controllers/resultController';
import { authorize } from '../middleware/auth';

describe('Centralized Arrear Calculation Engine — 15 Master Scenarios', () => {
  const dummyRule = {
    minPassPercentage: 50,
    minInternalPassMarks: 20,
    minExternalPassMarks: 30,
    sgpaExcludeFailedSubjects: false,
    gradeThresholds: getDefaultGradeThresholds(),
  } as any;

  // Scenario 1: Student has no failed subjects -> Active Arrears Count = 0
  it('Scenario 1: returns 0 active arrears when student has no failed subjects', () => {
    const records = [
      {
        subjectId: { code: 'CS101', name: 'Intro to CS', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 75,
        maximumMarks: 100,
        resultStatus: 'PASS',
        isPassed: true,
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'MA101', name: 'Calculus I', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 82,
        maximumMarks: 100,
        resultStatus: 'PASS',
        isPassed: true,
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    expect(summary.activeArrearsCount).toBe(0);
    expect(summary.clearedArrearsCount).toBe(0);
    expect(summary.totalPendingCredits).toBe(0);
    expect(summary.activeArrears).toHaveLength(0);
  });

  // Scenario 2: Student fails one subject -> Active Arrears Count = 1
  it('Scenario 2: returns 1 active arrear when student fails one subject', () => {
    const records = [
      {
        subjectId: { code: 'CS101', name: 'Intro to CS', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 75,
        maximumMarks: 100,
        resultStatus: 'PASS',
        isPassed: true,
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'MA101', name: 'Calculus I', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 38,
        maximumMarks: 100,
        resultStatus: 'FAIL',
        isPassed: false,
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    expect(summary.activeArrearsCount).toBe(1);
    expect(summary.totalPendingCredits).toBe(4);
    expect(summary.activeArrears[0].subjectCode).toBe('MA101');
    expect(summary.activeArrears[0].isCleared).toBe(false);
  });

  // Scenario 3: Student fails three distinct subjects -> Active Arrears Count = 3
  it('Scenario 3: returns 3 active arrears when student fails three distinct subjects', () => {
    const records = [
      {
        subjectId: { code: 'CS101', name: 'Intro to CS', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 35,
        maximumMarks: 100,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'MA101', name: 'Calculus I', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 40,
        maximumMarks: 100,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'PH101', name: 'Physics I', credits: 3 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 42,
        maximumMarks: 100,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'CH101', name: 'Chemistry', credits: 3 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 78,
        maximumMarks: 100,
        resultStatus: 'PASS',
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    expect(summary.activeArrearsCount).toBe(3);
    expect(summary.totalPendingCredits).toBe(11); // 4 + 4 + 3
    expect(summary.activeArrears.map((a) => a.subjectCode)).toEqual(['CS101', 'MA101', 'PH101']);
  });

  // Scenario 4: Student fails the same subject in multiple attempts -> 1 for that subject
  it('Scenario 4: counts multiple failed attempts at the same subject as exactly 1 active arrear', () => {
    const records = [
      {
        subjectId: { code: 'CS101', name: 'Intro to CS', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 32,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'CS101', name: 'Intro to CS', credits: 4 },
        semesterId: { semesterNumber: 2 },
        attemptNumber: 2,
        isArrear: true,
        totalMarks: 38,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'CS101', name: 'Intro to CS', credits: 4 },
        semesterId: { semesterNumber: 3 },
        attemptNumber: 3,
        isArrear: true,
        totalMarks: 44,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    expect(summary.activeArrearsCount).toBe(1);
    expect(summary.totalArrearAttempts).toBe(3);
    expect(summary.activeArrears[0].totalAttempts).toBe(3);
    expect(summary.activeArrears[0].latestAttemptNumber).toBe(3);
    expect(summary.activeArrears[0].latestTotalMarks).toBe(44);
  });

  // Scenario 5: Student fails a subject and subsequently passes it -> 0 active arrears
  it('Scenario 5: decrements active arrears to 0 when previously failed subject is subsequently passed', () => {
    const records = [
      {
        subjectId: { code: 'MA101', name: 'Calculus I', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 34,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'MA101', name: 'Calculus I', credits: 4 },
        semesterId: { semesterNumber: 2 },
        attemptNumber: 2,
        isArrear: true,
        totalMarks: 68,
        grade: 'B+',
        gradePoint: 7,
        resultStatus: 'PASS',
        isPassed: true,
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    expect(summary.activeArrearsCount).toBe(0);
    expect(summary.clearedArrearsCount).toBe(1);
    expect(summary.totalClearedCredits).toBe(4);
    expect(summary.clearedArrears[0].subjectCode).toBe('MA101');
    expect(summary.clearedArrears[0].isCleared).toBe(true);
    expect(summary.clearedArrears[0].totalAttempts).toBe(2);
  });

  // Scenario 6: Student has two uncleared subjects and clears one -> Active Arrears = 1
  it('Scenario 6: correctly reports 1 active and 1 cleared arrear when student clears one of two backlogs', () => {
    const records = [
      // Subject 1: MA101 failed sem 1, passed sem 2
      {
        subjectId: { code: 'MA101', name: 'Calculus I', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 30,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'MA101', name: 'Calculus I', credits: 4 },
        semesterId: { semesterNumber: 2 },
        attemptNumber: 2,
        totalMarks: 65,
        resultStatus: 'PASS',
        publicationStatus: 'PUBLISHED',
      },
      // Subject 2: CS101 failed sem 1, still uncleared
      {
        subjectId: { code: 'CS101', name: 'Intro to CS', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 40,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    expect(summary.activeArrearsCount).toBe(1);
    expect(summary.clearedArrearsCount).toBe(1);
    expect(summary.totalHistoricalArrearsCount).toBe(2);
    expect(summary.activeArrears[0].subjectCode).toBe('CS101');
    expect(summary.clearedArrears[0].subjectCode).toBe('MA101');
  });

  // Scenario 7: Student has an unpublished result -> No premature failure or clearance
  it('Scenario 7: does not prematurely fail or clear arrears for unpublished / draft examination records', () => {
    const records = [
      // Confirmed failure published in sem 1
      {
        subjectId: { code: 'CS101', name: 'Intro to CS', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 32,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      // Attempt 2 in sem 2 passed, BUT status is DRAFT (not published)
      {
        subjectId: { code: 'CS101', name: 'Intro to CS', credits: 4 },
        semesterId: { semesterNumber: 2 },
        attemptNumber: 2,
        totalMarks: 75,
        resultStatus: 'PASS',
        publicationStatus: 'DRAFT',
      },
      // New subject in sem 2 failed, BUT status is SUBMITTED (not published)
      {
        subjectId: { code: 'EC101', name: 'Electronics', credits: 3 },
        semesterId: { semesterNumber: 2 },
        attemptNumber: 1,
        totalMarks: 25,
        resultStatus: 'FAIL',
        publicationStatus: 'SUBMITTED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    // CS101 remains active arrear because attempt 2 is DRAFT; EC101 is not counted because it is not PUBLISHED
    expect(summary.activeArrearsCount).toBe(1);
    expect(summary.activeArrears[0].subjectCode).toBe('CS101');
    expect(summary.activeArrears[0].totalAttempts).toBe(1); // Only published attempt counted
  });

  // Scenario 8: Student has a withheld result -> Follow configured pending-result rules
  it('Scenario 8: preserves pending status for withheld results without treating as confirmed clearance', () => {
    const records = [
      {
        subjectId: { code: 'CS201', name: 'Data Structures', credits: 4 },
        semesterId: { semesterNumber: 2 },
        attemptNumber: 1,
        totalMarks: 35,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'CS201', name: 'Data Structures', credits: 4 },
        semesterId: { semesterNumber: 3 },
        attemptNumber: 2,
        totalMarks: 60,
        resultStatus: 'WITHHELD',
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    // Not cleared because latest published result is WITHHELD
    expect(summary.activeArrearsCount).toBe(1);
    expect(summary.clearedArrearsCount).toBe(0);
    expect(summary.activeArrears[0].latestResultStatus).toBe('WITHHELD');
  });

  // Scenario 9: Student has an absent result -> Follow configured official arrear rules (counted as arrear)
  it('Scenario 9: treats confirmed ABSENT result in published examination as an active arrear', () => {
    const records = [
      {
        subjectId: { code: 'CS301', name: 'Algorithms', credits: 4 },
        semesterId: { semesterNumber: 3 },
        attemptNumber: 1,
        internalMarks: 25,
        externalMarks: 0,
        totalMarks: 25,
        resultStatus: 'ABSENT',
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    expect(summary.activeArrearsCount).toBe(1);
    expect(summary.activeArrears[0].subjectCode).toBe('CS301');
    expect(summary.activeArrears[0].latestResultStatus).toBe('ABSENT');
  });

  // Scenario 10: Student has no examination records -> Verified empty state, no fabricated data
  it('Scenario 10: returns verified empty state with zero fabricated data when student has no records', () => {
    const summary = calculateStudentArrears([], dummyRule);
    expect(summary.activeArrearsCount).toBe(0);
    expect(summary.clearedArrearsCount).toBe(0);
    expect(summary.totalHistoricalArrearsCount).toBe(0);
    expect(summary.totalArrearAttempts).toBe(0);
    expect(summary.totalPendingCredits).toBe(0);
    expect(summary.activeArrears).toEqual([]);
    expect(summary.clearedArrears).toEqual([]);
  });

  // Scenario 11: Student has duplicate historical records -> Prevent duplicate subject counting and flag issue
  it('Scenario 11: prevents duplicate counting when student has duplicate attempt records', () => {
    const records = [
      {
        _id: 'rec_1a',
        subjectId: { code: 'CS401', name: 'Databases', credits: 4 },
        semesterId: { semesterNumber: 4 },
        attemptNumber: 1,
        totalMarks: 35,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
      // Accidental duplicate entry of the exact same attempt
      {
        _id: 'rec_1b',
        subjectId: { code: 'CS401', name: 'Databases', credits: 4 },
        semesterId: { semesterNumber: 4 },
        attemptNumber: 1,
        totalMarks: 35,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    expect(summary.activeArrearsCount).toBe(1);
    expect(summary.activeArrears[0].subjectCode).toBe('CS401');
  });

  // Scenario 12: Two students have different academic histories -> Each sees only their own correct count
  it('Scenario 12: isolates calculations per student so each student sees strictly their own count', () => {
    const student1Records = [
      { subjectId: { code: 'CS101' }, semesterId: { semesterNumber: 1 }, totalMarks: 85, resultStatus: 'PASS', publicationStatus: 'PUBLISHED' },
    ];
    const student2Records = [
      { subjectId: { code: 'CS101' }, semesterId: { semesterNumber: 1 }, totalMarks: 35, resultStatus: 'FAIL', publicationStatus: 'PUBLISHED' },
      { subjectId: { code: 'MA101' }, semesterId: { semesterNumber: 1 }, totalMarks: 40, resultStatus: 'FAIL', publicationStatus: 'PUBLISHED' },
    ];

    const s1Summary = calculateStudentArrears(student1Records, dummyRule);
    const s2Summary = calculateStudentArrears(student2Records, dummyRule);

    expect(s1Summary.activeArrearsCount).toBe(0);
    expect(s2Summary.activeArrearsCount).toBe(2);
  });

  // Scenario 13: A result is validly corrected and republished -> Recalculate affected records
  it('Scenario 13: updates arrear status when a result is audited and corrected from FAIL to PASS', () => {
    const originalRecords = [
      {
        subjectId: { code: 'MA101', name: 'Calculus', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 48,
        resultStatus: 'FAIL',
        publicationStatus: 'PUBLISHED',
      },
    ];

    const beforeSummary = calculateStudentArrears(originalRecords, dummyRule);
    expect(beforeSummary.activeArrearsCount).toBe(1);

    // After re-evaluation/correction: marks updated to 52, status to PASS
    const correctedRecords = [
      {
        subjectId: { code: 'MA101', name: 'Calculus', credits: 4 },
        semesterId: { semesterNumber: 1 },
        attemptNumber: 1,
        totalMarks: 52,
        resultStatus: 'PASS',
        isPassed: true,
        publicationStatus: 'PUBLISHED',
      },
    ];

    const afterSummary = calculateStudentArrears(correctedRecords, dummyRule);
    expect(afterSummary.activeArrearsCount).toBe(0);
  });

  // Scenario 14: API endpoint verification
  it('Scenario 14: API gracefully handles student arrears request with proper structure', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_stu1';
      req.userRole = 'STUDENT';
      req.userEmail = 'student1@cehp.edu';
      next();
    });
    app.get('/api/v1/results/my-arrears', authorize('STUDENT'), getMyArrears);

    const res = await request(app).get('/api/v1/results/my-arrears');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.activeArrearsCount).toBe('number');
    expect(Array.isArray(res.body.data.activeArrears)).toBe(true);
    expect(Array.isArray(res.body.data.clearedArrears)).toBe(true);
  });

  // Scenario 15: The student clears an arrear in a later semester -> Retain valid history
  it('Scenario 15: updates active count while preserving historical examination attempts', () => {
    const records = [
      {
        subjectId: { code: 'CS202', name: 'Computer Architecture', credits: 4 },
        semesterId: { semesterNumber: 2 },
        attemptNumber: 1,
        totalMarks: 32,
        resultStatus: 'FAIL',
        examinationName: 'Nov/Dec 2023 Regular',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'CS202', name: 'Computer Architecture', credits: 4 },
        semesterId: { semesterNumber: 3 },
        attemptNumber: 2,
        totalMarks: 45,
        resultStatus: 'FAIL',
        examinationName: 'Apr/May 2024 Arrear',
        publicationStatus: 'PUBLISHED',
      },
      {
        subjectId: { code: 'CS202', name: 'Computer Architecture', credits: 4 },
        semesterId: { semesterNumber: 4 },
        attemptNumber: 3,
        totalMarks: 72,
        grade: 'A',
        resultStatus: 'PASS',
        isPassed: true,
        examinationName: 'Nov/Dec 2024 Arrear Supplementary',
        publicationStatus: 'PUBLISHED',
      },
    ];

    const summary = calculateStudentArrears(records, dummyRule);
    expect(summary.activeArrearsCount).toBe(0);
    expect(summary.clearedArrearsCount).toBe(1);
    expect(summary.totalArrearAttempts).toBe(3);

    const clearedItem = summary.clearedArrears[0];
    expect(clearedItem.totalAttempts).toBe(3);
    expect(clearedItem.clearanceSemester).toBe(4);
    expect(clearedItem.attempts).toHaveLength(3);
    expect(clearedItem.attempts[0].resultStatus).toBe('FAIL');
    expect(clearedItem.attempts[1].resultStatus).toBe('FAIL');
    expect(clearedItem.attempts[2].resultStatus).toBe('PASS');
  });
});

describe('Security, RBAC, and Academic Integrity Audit Verification', () => {
  // Test 16: Student cannot access administrative reconciliation endpoint
  it('strictly blocks STUDENT from calling administrative reconciliation (HTTP 403)', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_stu1';
      req.userRole = 'STUDENT';
      next();
    });
    app.post('/api/v1/results/reconcile', authorize('ADMIN', 'EXAM_OFFICER'), reconcileArrears);
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      res.status(err.statusCode || 500).json({ success: false, message: err.message });
    });

    const res = await request(app).post('/api/v1/results/reconcile').send({ dryRun: true });
    expect(res.status).toBe(403);
  });

  // Test 17: Administrator CAN call academic integrity audit
  it('allows Administrator to run academic integrity audit', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_admin';
      req.userRole = 'ADMIN';
      next();
    });
    app.get('/api/v1/results/audit-integrity', authorize('ADMIN', 'EXAM_OFFICER'), auditAcademicIntegrity);

    const res = await request(app).get('/api/v1/results/audit-integrity');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isClean).toBe(true);
    expect(res.body.data.auditedRecordsCount).toBeGreaterThanOrEqual(0);
  });

  // Test 18: Administrator CAN call academic reconciliation
  it('allows Administrator to run academic reconciliation simulation (dryRun)', async () => {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res: Response, next: NextFunction) => {
      req.userId = 'usr_admin';
      req.userRole = 'ADMIN';
      next();
    });
    app.post('/api/v1/results/reconcile', authorize('ADMIN', 'EXAM_OFFICER'), reconcileArrears);

    const res = await request(app).post('/api/v1/results/reconcile').send({ dryRun: true });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dryRun).toBe(true);
  });
});
