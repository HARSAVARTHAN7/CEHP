import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { performanceSummary, generateStudyPlan, academicChat, riskAnalysis } from '../controllers/aiController';

const router = Router();
router.use(authenticate);

router.post('/performance-summary', performanceSummary);
router.post('/study-plan', generateStudyPlan);
router.post('/chat', academicChat);
router.post('/risk-analysis', riskAnalysis);

export default router;
