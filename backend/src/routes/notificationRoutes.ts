import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { listNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

export default router;
