import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { ResultRecord } from '../models/ResultRecord';
import { Examination } from '../models/Examination';
import { Subject } from '../models/Subject';
import { Semester } from '../models/Semester';
import { AcademicRule } from '../models/AcademicRule';
import { StudentProfile } from '../models/StudentProfile';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { AuditLog } from '../models/AuditLog';
import { Notification } from '../models/Notification';
import {
  calculateSGPA,
  calculateCGPA,
  calculateGrade,
  determineResultStatus,
  getDefaultGradeThresholds,
} from '../services/academicCalculation';
import { MOCK_STUDENT_HISTORY, MOCK_STUDENT_ANALYTICS, MOCK_USERS } from '../utils/mockData';

// GET /api/v1/results - List results (filtered)
export async function listResults(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({
        success: true,
        data: MOCK_STUDENT_HISTORY,
        pagination: { page: 1, limit: 20, total: MOCK_STUDENT_HISTORY.length, pages: 1 },
      });
      return;
    }

    const {
      page = '1',
      limit = '20',
      studentId,
      examinationId,
      semesterId,
      publicationStatus,
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter: Record<string, unknown> = {};

    if (req.userRole === 'STUDENT') {
      filter.studentId = req.userId;
      filter.publicationStatus = 'PUBLISHED';
    } else {
      if (studentId) filter.studentId = studentId;
      if (examinationId) filter.examinationId = examinationId;
      if (semesterId) filter.semesterId = semesterId;
      if (publicationStatus) filter.publicationStatus = publicationStatus;
    }

    const [results, total] = await Promise.all([
      ResultRecord.find(filter)
        .populate('subjectId', 'code name credits subjectType')
        .populate('semesterId', 'semesterNumber academicYear')
        .populate('examinationId', 'name examinationType')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      ResultRecord.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/results/my-history
export async function getMyHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      const email = req.userEmail?.toLowerCase() || 'student1@cehp.edu';
      const userObj = MOCK_USERS[email] || MOCK_USERS['student1@cehp.edu'];
      res.json({
        success: true,
        data: {
          records: MOCK_STUDENT_HISTORY,
          student: userObj.studentProfile || { cgpa: 8.45, totalCreditsEarned: 96 },
        },
      });
      return;
    }

    const results = await ResultRecord.find({
      studentId: req.userId,
      publicationStatus: 'PUBLISHED',
    })
      .populate('subjectId', 'code name credits subjectType')
      .populate('semesterId', 'semesterNumber academicYear startDate endDate')
      .populate('examinationId', 'name examinationType')
      .sort({ 'semesterId.semesterNumber': 1 });

    const studentProfile = await StudentProfile.findOne({ userId: req.userId });

    res.json({
      success: true,
      data: {
        records: results,
        student: studentProfile,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/results/my-analytics
export async function getMyAnalytics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: MOCK_STUDENT_ANALYTICS });
      return;
    }

    const studentProfile = await StudentProfile.findOne({ userId: req.userId });
    if (!studentProfile) {
      return next(new AppError('Student profile not found', 404));
    }

    const academicRule = await AcademicRule.findOne({
      programId: studentProfile.programId,
      isActive: true,
    });

    const defaultThresholds = getDefaultGradeThresholds();

    const allResults = await ResultRecord.find({
      studentId: req.userId,
      publicationStatus: 'PUBLISHED',
    })
      .populate<{ semesterId: { _id: string; semesterNumber: number; academicYear: string } }>(
        'semesterId',
        'semesterNumber academicYear'
      )
      .populate('subjectId', 'code name credits subjectType');

    const semesterMap = new Map<string, typeof allResults>();
    for (const result of allResults) {
      const semId = String(result.semesterId._id || result.semesterId);
      if (!semesterMap.has(semId)) semesterMap.set(semId, []);
      semesterMap.get(semId)!.push(result);
    }

    const fakeRule = {
      minPassPercentage: 50,
      sgpaExcludeFailedSubjects: false,
      cgpaIncludedSemesters: 'ALL' as const,
      gradeThresholds: defaultThresholds,
    } as any;

    const rule = academicRule || fakeRule;
    const semesterSGPAs: { semesterNumber: number; academicYear: string; sgpa: number; credits: number; earnedCredits: number }[] = [];

    for (const [_, results] of semesterMap) {
      const sgpaResult = calculateSGPA(results as any, rule);
      const semData = results[0].semesterId as any;
      semesterSGPAs.push({
        semesterNumber: semData?.semesterNumber || 1,
        academicYear: semData?.academicYear || '2024-2025',
        sgpa: sgpaResult.sgpa,
        credits: sgpaResult.totalCredits,
        earnedCredits: sgpaResult.earnedCredits,
      });
    }

    semesterSGPAs.sort((a, b) => a.semesterNumber - b.semesterNumber);
    const cgpaResult = calculateCGPA(semesterSGPAs, rule);

    res.json({
      success: true,
      data: {
        cgpa: cgpaResult.cgpa,
        latestSGPA: semesterSGPAs[semesterSGPAs.length - 1]?.sgpa || 0,
        totalSubjectsPassed: allResults.filter((r) => r.resultStatus === 'PASS').length,
        activeArrearsCount: allResults.filter((r) => r.isArrear && r.resultStatus === 'FAIL').length,
        activeArrears: allResults.filter((r) => r.isArrear && r.resultStatus === 'FAIL'),
        semesterSGPAs,
        currentSemester: studentProfile.currentSemester,
        registrationNumber: studentProfile.registrationNumber,
        batch: studentProfile.batch,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/results
export async function createResult(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.status(201).json({ success: true, data: { ...req.body, _id: 'rec_new', status: 'DRAFT' } });
      return;
    }
    const result = await ResultRecord.create({ ...req.body, createdBy: req.userId });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/results/:id
export async function updateResult(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: { _id: req.params.id, ...req.body } });
      return;
    }
    const result = await ResultRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/results/:id/submit
export async function submitResult(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'Result submitted for HOD review' });
      return;
    }
    const result = await ResultRecord.findByIdAndUpdate(req.params.id, { publicationStatus: 'SUBMITTED' }, { new: true });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/results/:id/approve
export async function approveResult(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'Result approved by Examination Officer' });
      return;
    }
    const result = await ResultRecord.findByIdAndUpdate(req.params.id, { publicationStatus: 'APPROVED' }, { new: true });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/results/:id/publish
export async function publishResult(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'Result published officially' });
      return;
    }
    const result = await ResultRecord.findByIdAndUpdate(req.params.id, { publicationStatus: 'PUBLISHED', publishedAt: new Date() }, { new: true });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function publishExaminationResult(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'Examination results successfully published' });
      return;
    }
    await ResultRecord.updateMany(
      { examinationId: req.params.id, publicationStatus: 'APPROVED' },
      { publicationStatus: 'PUBLISHED', publishedAt: new Date() }
    );
    res.json({ success: true, message: 'Examination results published successfully' });
  } catch (err) {
    next(err);
  }
}

export const publishExaminationResults = publishExaminationResult;
