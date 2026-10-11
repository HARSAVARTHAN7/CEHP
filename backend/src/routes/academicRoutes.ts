import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listDepartments, createDepartment, updateDepartment,
  listPrograms, createProgram, updateProgram,
  listSubjects, createSubject, updateSubject,
  listSemesters, createSemester, updateSemester,
  listExaminations, createExamination, updateExamination, getExamination,
} from '../controllers/academicController';

const router = Router();
router.use(authenticate);

// Departments
router.get('/departments', listDepartments);
router.post('/departments', authorize('ADMIN'), createDepartment);
router.patch('/departments/:id', authorize('ADMIN'), updateDepartment);

// Programs
router.get('/programs', listPrograms);
router.post('/programs', authorize('ADMIN'), createProgram);
router.patch('/programs/:id', authorize('ADMIN'), updateProgram);

// Subjects
router.get('/subjects', listSubjects);
router.post('/subjects', authorize('ADMIN', 'EXAM_OFFICER'), createSubject);
router.patch('/subjects/:id', authorize('ADMIN', 'EXAM_OFFICER'), updateSubject);

// Semesters
router.get('/semesters', listSemesters);
router.post('/semesters', authorize('ADMIN', 'EXAM_OFFICER'), createSemester);
router.patch('/semesters/:id', authorize('ADMIN', 'EXAM_OFFICER'), updateSemester);

// Examinations
router.get('/examinations', listExaminations);
router.get('/examinations/:id', getExamination);
router.post('/examinations', authorize('ADMIN', 'EXAM_OFFICER'), createExamination);
router.patch('/examinations/:id', authorize('ADMIN', 'EXAM_OFFICER'), updateExamination);

export default router;
