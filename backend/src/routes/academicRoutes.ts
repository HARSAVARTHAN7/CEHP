import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  listDepartments, createDepartment, updateDepartment, deleteDepartment,
  listPrograms, createProgram, updateProgram, deleteProgram,
  listSubjects, createSubject, updateSubject, deleteSubject,
  listSemesters, createSemester, updateSemester, deleteSemester,
  listExaminations, createExamination, updateExamination, getExamination, deleteExamination,
} from '../controllers/academicController';

const router = Router();
router.use(authenticate);

// Departments
router.get('/departments', listDepartments);
router.post('/departments', authorize('ADMIN'), createDepartment);
router.patch('/departments/:id', authorize('ADMIN'), updateDepartment);
router.delete('/departments/:id', authorize('ADMIN'), deleteDepartment);

// Programs
router.get('/programs', listPrograms);
router.post('/programs', authorize('ADMIN'), createProgram);
router.patch('/programs/:id', authorize('ADMIN'), updateProgram);
router.delete('/programs/:id', authorize('ADMIN'), deleteProgram);

// Subjects
router.get('/subjects', listSubjects);
router.post('/subjects', authorize('ADMIN', 'EXAM_OFFICER'), createSubject);
router.patch('/subjects/:id', authorize('ADMIN', 'EXAM_OFFICER'), updateSubject);
router.delete('/subjects/:id', authorize('ADMIN', 'EXAM_OFFICER'), deleteSubject);

// Semesters
router.get('/semesters', listSemesters);
router.post('/semesters', authorize('ADMIN', 'EXAM_OFFICER'), createSemester);
router.patch('/semesters/:id', authorize('ADMIN', 'EXAM_OFFICER'), updateSemester);
router.delete('/semesters/:id', authorize('ADMIN', 'EXAM_OFFICER'), deleteSemester);

// Examinations
router.get('/examinations', listExaminations);
router.get('/examinations/:id', getExamination);
router.post('/examinations', authorize('ADMIN', 'EXAM_OFFICER'), createExamination);
router.patch('/examinations/:id', authorize('ADMIN', 'EXAM_OFFICER'), updateExamination);
router.delete('/examinations/:id', authorize('ADMIN', 'EXAM_OFFICER'), deleteExamination);

export default router;
