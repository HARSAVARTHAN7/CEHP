import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { listUsers, getUser, createUser, updateUser, deleteUser, adminStats } from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/stats', authorize('ADMIN', 'EXAM_OFFICER'), adminStats);
router.get('/', authorize('ADMIN', 'EXAM_OFFICER', 'HOD'), listUsers);
router.get('/:id', authorize('ADMIN', 'EXAM_OFFICER', 'HOD'), getUser);
router.post('/', authorize('ADMIN', 'EXAM_OFFICER'), createUser);
router.patch('/:id', authorize('ADMIN', 'EXAM_OFFICER'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
