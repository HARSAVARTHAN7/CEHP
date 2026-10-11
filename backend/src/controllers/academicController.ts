import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { Department } from '../models/Department';
import { Program } from '../models/Program';
import { Subject } from '../models/Subject';
import { Semester } from '../models/Semester';
import { Examination } from '../models/Examination';
import { AppError } from '../utils/AppError';
import { MOCK_DEPARTMENTS, MOCK_SUBJECTS, MOCK_SEMESTERS, MOCK_EXAMINATIONS } from '../utils/mockData';

// ---- DEPARTMENTS ----
export async function listDepartments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: MOCK_DEPARTMENTS });
      return;
    }
    const departments = await Department.find({ status: 'ACTIVE' }).sort({ name: 1 });
    res.json({ success: true, data: departments });
  } catch (err) { next(err); }
}

export async function createDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(201).json({ success: true, data: { ...req.body, _id: 'dept_new', status: 'ACTIVE' } });
      return;
    }
    const { name, code, description } = req.body;
    const dept = await Department.create({ name, code, description });
    res.status(201).json({ success: true, data: dept });
  } catch (err) { next(err); }
}

export async function updateDepartment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: { _id: req.params.id, ...req.body } });
      return;
    }
    const { name, description, status } = req.body;
    const dept = await Department.findByIdAndUpdate(req.params.id, { name, description, status }, { new: true, runValidators: true });
    if (!dept) return next(new AppError('Department not found', 404));
    res.json({ success: true, data: dept });
  } catch (err) { next(err); }
}

// ---- PROGRAMS ----
export async function listPrograms(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({
        success: true,
        data: [{ _id: 'prog_cse', name: 'B.E. Computer Science and Engineering', code: 'CSE_BE', duration: 4, totalSemesters: 8 }],
      });
      return;
    }
    const { departmentId } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { status: 'ACTIVE' };
    if (departmentId) filter.departmentId = departmentId;
    const programs = await Program.find(filter).populate('departmentId', 'name code').sort({ name: 1 });
    res.json({ success: true, data: programs });
  } catch (err) { next(err); }
}

export async function createProgram(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(201).json({ success: true, data: { ...req.body, _id: 'prog_new' } });
      return;
    }
    const { name, code, departmentId, duration, totalSemesters, creditSystem, degree } = req.body;
    const program = await Program.create({ name, code, departmentId, duration, totalSemesters, creditSystem, degree });
    res.status(201).json({ success: true, data: program });
  } catch (err) { next(err); }
}

export async function updateProgram(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: { _id: req.params.id, ...req.body } });
      return;
    }
    const allowed = ['name', 'duration', 'totalSemesters', 'creditSystem', 'degree', 'status'];
    const updates: Record<string, unknown> = {};
    for (const f of allowed) if (req.body[f] !== undefined) updates[f] = req.body[f];
    const program = await Program.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!program) return next(new AppError('Program not found', 404));
    res.json({ success: true, data: program });
  } catch (err) { next(err); }
}

// ---- SUBJECTS ----
export async function listSubjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: MOCK_SUBJECTS });
      return;
    }
    const { programId, semester } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { activeStatus: 'ACTIVE' };
    if (programId) filter.programId = programId;
    if (semester) filter.applicableSemester = parseInt(semester);
    const subjects = await Subject.find(filter).sort({ applicableSemester: 1, code: 1 });
    res.json({ success: true, data: subjects });
  } catch (err) { next(err); }
}

export async function createSubject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(201).json({ success: true, data: { ...req.body, _id: 'sub_new' } });
      return;
    }
    const subject = await Subject.create(req.body);
    res.status(201).json({ success: true, data: subject });
  } catch (err) { next(err); }
}

export async function updateSubject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: { _id: req.params.id, ...req.body } });
      return;
    }
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return next(new AppError('Subject not found', 404));
    res.json({ success: true, data: subject });
  } catch (err) { next(err); }
}

// ---- SEMESTERS ----
export async function listSemesters(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: MOCK_SEMESTERS });
      return;
    }
    const semesters = await Semester.find().sort({ semesterNumber: 1 });
    res.json({ success: true, data: semesters });
  } catch (err) { next(err); }
}

export async function createSemester(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(201).json({ success: true, data: { ...req.body, _id: 'sem_new' } });
      return;
    }
    const semester = await Semester.create(req.body);
    res.status(201).json({ success: true, data: semester });
  } catch (err) { next(err); }
}

export async function updateSemester(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: { _id: req.params.id, ...req.body } });
      return;
    }
    const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!semester) return next(new AppError('Semester not found', 404));
    res.json({ success: true, data: semester });
  } catch (err) { next(err); }
}

// ---- EXAMINATIONS ----
export async function listExaminations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: MOCK_EXAMINATIONS });
      return;
    }
    const examinations = await Examination.find().sort({ createdAt: -1 });
    res.json({ success: true, data: examinations });
  } catch (err) { next(err); }
}

export async function getExamination(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: MOCK_EXAMINATIONS[0] });
      return;
    }
    const examination = await Examination.findById(req.params.id);
    if (!examination) return next(new AppError('Examination not found', 404));
    res.json({ success: true, data: examination });
  } catch (err) { next(err); }
}

export async function createExamination(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(201).json({ success: true, data: { ...req.body, _id: 'exam_new' } });
      return;
    }
    const examination = await Examination.create({ ...req.body, createdBy: req.userId });
    res.status(201).json({ success: true, data: examination });
  } catch (err) { next(err); }
}

export async function updateExamination(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: { _id: req.params.id, ...req.body } });
      return;
    }
    const examination = await Examination.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!examination) return next(new AppError('Examination not found', 404));
    res.json({ success: true, data: examination });
  } catch (err) { next(err); }
}
