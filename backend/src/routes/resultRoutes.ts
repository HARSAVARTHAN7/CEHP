import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listResults, getMyHistory, getMyAnalytics, getMyArrears, getStudentArrears,
  createResult, updateResult, deleteResult, correctResult,
  submitResult, approveResult, publishResult, publishExaminationResults,
  downloadTranscriptPDF, auditAcademicIntegrity, reconcileArrears,
} from '../controllers/resultController';

const router = Router();
router.use(authenticate);

// Student self-service routes (with aliases for both /students/me/* and /results/my-*)
router.get('/students/me/history', authorize('STUDENT'), getMyHistory);
router.get('/results/my-history', authorize('STUDENT'), getMyHistory);

router.get('/students/me/analytics', authorize('STUDENT'), getMyAnalytics);
router.get('/results/my-analytics', authorize('STUDENT'), getMyAnalytics);

router.get('/students/me/arrears', authorize('STUDENT'), getMyArrears);
router.get('/results/my-arrears', authorize('STUDENT'), getMyArrears);

router.get('/students/me/transcript/pdf', authorize('STUDENT'), downloadTranscriptPDF);
router.get('/results/transcript/me/pdf', authorize('STUDENT'), downloadTranscriptPDF);

// Academic integrity audit and safe reconciliation (Admin and Exam Officer)
router.get('/results/audit-integrity', authorize('ADMIN', 'EXAM_OFFICER'), auditAcademicIntegrity);
router.post('/results/reconcile', authorize('ADMIN', 'EXAM_OFFICER'), reconcileArrears);
router.get('/students/:studentId/arrears', authorize('ADMIN', 'EXAM_OFFICER'), getStudentArrears);

// Results CRUD & Transcripts
router.get('/results', listResults);
router.get('/results/transcript/:studentId/pdf', authorize('ADMIN', 'EXAM_OFFICER'), downloadTranscriptPDF);
router.post('/results', authorize('FACULTY', 'EXAM_OFFICER', 'ADMIN'), createResult);
router.patch('/results/:id', authorize('FACULTY', 'EXAM_OFFICER', 'ADMIN'), updateResult);
router.delete('/results/:id', authorize('ADMIN'), deleteResult);

// Audited Result Correction
router.post('/results/:id/correct', authorize('ADMIN', 'EXAM_OFFICER'), correctResult);

// Lifecycle transitions (HOD can approve departmental marks; ONLY EXAM_OFFICER and ADMIN can publish)
router.post('/results/:id/submit', authorize('FACULTY', 'EXAM_OFFICER'), submitResult);
router.post('/results/:id/approve', authorize('HOD', 'EXAM_OFFICER', 'ADMIN'), approveResult);
router.post('/results/:id/publish', authorize('EXAM_OFFICER', 'ADMIN'), publishResult);

// Bulk publish by examination (ONLY EXAM_OFFICER and ADMIN)
router.post('/examinations/:examinationId/publish-results', authorize('EXAM_OFFICER', 'ADMIN'), publishExaminationResults);
router.post('/examinations/:examinationId/publish', authorize('EXAM_OFFICER', 'ADMIN'), publishExaminationResults);

export default router;

