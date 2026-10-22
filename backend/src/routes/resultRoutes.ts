import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listResults, getMyHistory, getMyAnalytics,
  createResult, updateResult, deleteResult, correctResult,
  submitResult, approveResult, publishResult, publishExaminationResults,
  downloadTranscriptPDF,
} from '../controllers/resultController';

const router = Router();
router.use(authenticate);

// Student self-service
router.get('/students/me/history', authorize('STUDENT'), getMyHistory);
router.get('/students/me/analytics', authorize('STUDENT'), getMyAnalytics);
router.get('/students/me/transcript/pdf', authorize('STUDENT'), downloadTranscriptPDF);

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
