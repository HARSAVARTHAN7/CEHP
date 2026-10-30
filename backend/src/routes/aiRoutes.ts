import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import {
  getAiStatus,
  performanceSummary,
  generateStudyPlan,
  academicChat,
  riskAnalysis,
  arrearGuidance,
  explainResult,
  academicSuggestions,
} from '../controllers/aiController';

const router = Router();
router.use(authenticate);

const aiChatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 requests per minute
  message: { success: false, message: 'Too many AI inquiries submitted. Please wait 1 minute before asking more questions.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Diagnostic status
router.get('/status', getAiStatus);

// Core AI features
router.post('/performance-summary', performanceSummary);
router.post('/study-plan', generateStudyPlan);
router.post('/chat', aiChatLimiter, academicChat);
router.post('/risk-analysis', riskAnalysis);
router.post('/arrear-guidance', arrearGuidance);
router.post('/explain-result', explainResult);
router.post('/academic-suggestions', academicSuggestions);

export default router;
