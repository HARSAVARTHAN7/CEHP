import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listResults, getMyHistory, getMyAnalytics,
  createResult, updateResult,
  submitResult, approveResult, publishResult, publishExaminationResults,
} from '../controllers/resultController';

const router = Router();
router.use(authenticate);

// Student self-service
router.get('/students/me/history', authorize('STUDENT'), getMyHistory);
router.get('/students/me/analytics', authorize('STUDENT'), getMyAnalytics);

// Results CRUD
router.get('/results', listResults);
router.post('/results', authorize('FACULTY', 'EXAM_OFFICER', 'ADMIN'), createResult);
router.patch('/results/:id', authorize('FACULTY', 'EXAM_OFFICER', 'ADMIN'), updateResult);

// Lifecycle transitions
router.post('/results/:id/submit', authorize('FACULTY', 'EXAM_OFFICER'), submitResult);
router.post('/results/:id/approve', authorize('EXAM_OFFICER', 'ADMIN'), approveResult);
router.post('/results/:id/publish', authorize('EXAM_OFFICER', 'ADMIN'), publishResult);

// Bulk publish by examination
router.post('/examinations/:examinationId/publish-results', authorize('EXAM_OFFICER', 'ADMIN'), publishExaminationResults);

export default router;
