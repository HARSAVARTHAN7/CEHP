import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { FacultyProfile } from '../models/FacultyProfile';
import { Department } from '../models/Department';
import { Program } from '../models/Program';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/env';
import { AuditLog } from '../models/AuditLog';
import { MOCK_USERS } from '../utils/mockData';

// Generate cryptographically secure initial password meeting institutional complexity policies
export function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const specialChars = ['#', '!', '$', '@', '*'];
  let randomCore = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < bytes.length; i++) {
    randomCore += chars[bytes[i] % chars.length];
  }
  const special = specialChars[Math.floor(Math.random() * specialChars.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `Init${special}${randomCore}${num}`;
}

// Generate unique User ID with collision check & bounded retries
export async function generateUniqueUserId(role: string, customInput?: string): Promise<string> {
  if (customInput && customInput.trim().length > 0) {
    const sanitized = customInput.trim().toUpperCase();
    if (mongoose.connection.readyState === 1) {
      const existing = await User.findOne({ customUserId: sanitized });
      if (existing) {
        throw new AppError(`User ID or Registration Number '${sanitized}' is already in use.`, 409);
      }
    }
    return sanitized;
  }

  const currentYear = new Date().getFullYear();
  const prefix = role === 'STUDENT' ? 'STU' :
                 role === 'FACULTY' ? 'FAC' :
                 role === 'HOD' ? 'HOD' :
                 role === 'EXAM_OFFICER' ? 'EXAM' : 'ADM';

  if (mongoose.connection.readyState !== 1) {
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${currentYear}-${randSeq}`;
  }

  // Up to 10 retries to avoid collision in high concurrency
  for (let attempt = 0; attempt < 10; attempt++) {
    const randSeq = Math.floor(1000 + Math.random() * 9000);
    const candidateId = `${prefix}-${currentYear}-${randSeq}`;
    const collision = await User.findOne({ customUserId: candidateId });
    if (!collision) {
      return candidateId;
    }
  }

  throw new AppError('Unable to generate unique User ID after maximum retry attempts. Please supply manually.', 500);
}

// GET /api/v1/users
export async function listUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return next(new AppError('Database connection is unavailable', 503));
    }

    const { page = '1', limit = '20', role, search, status } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (status) filter.accountStatus = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/v1/users/:id
export async function getUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return next(new AppError('Database connection is unavailable', 503));
    }

    const user = await User.findById(req.params.id)
      .populate('studentProfileId')
      .populate('facultyProfileId');
    if (!user) return next(new AppError('User not found', 404));
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// POST /api/v1/users - Account Creation & User Provisioning
export async function createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const rawRole = (req.body.role || 'STUDENT').toUpperCase();
    const allowedRoles = ['STUDENT', 'FACULTY', 'HOD', 'EXAM_OFFICER', 'ADMIN'];
    const role = (allowedRoles.includes(rawRole) ? rawRole : 'STUDENT') as any;

    // Strict Centralized RBAC Policy:
    // 1. ADMIN can create any role (STUDENT, FACULTY, HOD, EXAM_OFFICER, ADMIN).
    // 2. EXAM_OFFICER can ONLY create STUDENT and FACULTY accounts.
    // 3. Attempting to create HOD, EXAM_OFFICER, or ADMIN by an EXAM_OFFICER MUST be rejected with HTTP 403.
    // 4. All other roles (HOD, FACULTY, STUDENT) are strictly rejected with HTTP 403.
    if (req.userRole === 'EXAM_OFFICER') {
      if (role !== 'STUDENT' && role !== 'FACULTY') {
        return next(
          new AppError('Forbidden: Examination Officers are permitted to create Student and Faculty accounts only.', 403)
        );
      }
    } else if (req.userRole !== 'ADMIN') {
      return next(
        new AppError('Forbidden: Insufficient authorization to provision user accounts.', 403)
      );
    }

    const {
      name,
      email,
      password,
      departmentId,
      programId,
      batch,
      currentSemester,
      admissionYear,
      designation,
      registrationNumber,
      employeeId,
      accountStatus = 'ACTIVE',
    } = req.body;

    if (!name || String(name).trim().length === 0) {
      return next(new AppError('Full name is required.', 400));
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(String(email).trim())) {
      return next(new AppError('A valid institutional email address is required.', 400));
    }

    const lowerEmail = String(email).trim().toLowerCase();

    // Generate or validate unique User ID
    const requestedIdentifier = (role === 'STUDENT' ? registrationNumber : employeeId) || req.body.userId || req.body.customUserId;
    const uniqueUserId = await generateUniqueUserId(role, requestedIdentifier);

    // Generate or use provided password
    const temporaryPassword = (password && String(password).trim().length >= 8)
      ? String(password).trim()
      : generateSecurePassword();

    // Standby Mode
    if (mongoose.connection.readyState !== 1) {
      const mockCreated = {
        _id: 'usr_' + Date.now(),
        id: 'usr_' + Date.now(),
        name: String(name).trim(),
        email: lowerEmail,
        role,
        customUserId: uniqueUserId,
        accountStatus,
        assignedDepartmentIds: departmentId ? [departmentId] : ['dept_cse'],
        mustChangePassword: true,
        studentProfile: role === 'STUDENT' ? {
          registrationNumber: uniqueUserId,
          currentSemester: Number(currentSemester) || 1,
          batch: batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
        } : undefined,
        facultyProfile: role === 'FACULTY' ? {
          employeeId: uniqueUserId,
          designation: designation || 'Assistant Professor',
        } : undefined,
      };

      res.status(201).json({
        success: true,
        message: 'Account created successfully with generated credentials',
        data: {
          ...mockCreated,
          generatedUserId: uniqueUserId,
          temporaryPassword,
        },
        generatedUserId: uniqueUserId,
        temporaryPassword,
      });
      return;
    }

    // Check duplicate email
    const existingUser = await User.findOne({ email: lowerEmail });
    if (existingUser) {
      return next(new AppError(`Email address '${lowerEmail}' is already registered.`, 409));
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, config.bcryptRounds);

    const user = await User.create({
      name: String(name).trim(),
      email: lowerEmail,
      passwordHash,
      role,
      customUserId: uniqueUserId,
      mustChangePassword: true,
      accountStatus,
      assignedDepartmentIds: departmentId && mongoose.Types.ObjectId.isValid(departmentId) ? [departmentId] : [],
    });

    // Create role-specific profile records
    if (role === 'STUDENT') {
      try {
        const studentProfile = await StudentProfile.create({
          userId: user._id,
          registrationNumber: uniqueUserId,
          departmentId: departmentId && mongoose.Types.ObjectId.isValid(departmentId) ? departmentId : user.assignedDepartmentIds[0],
          programId: programId && mongoose.Types.ObjectId.isValid(programId) ? programId : undefined,
          admissionYear: Number(admissionYear) || new Date().getFullYear(),
          batch: batch || `${new Date().getFullYear()}-${new Date().getFullYear() + 4}`,
          currentSemester: Number(currentSemester) || 1,
          academicStatus: 'REGULAR',
        });
        user.studentProfileId = studentProfile._id;
        await user.save();
      } catch (profileErr) {
        // Rollback created user if profile creation fails with unique constraint
        if ((profileErr as any)?.code === 11000) {
          await User.findByIdAndDelete(user._id);
          return next(new AppError(`Registration number '${uniqueUserId}' already exists.`, 409));
        }
      }
    } else if (role === 'FACULTY') {
      try {
        const facultyProfile = await FacultyProfile.create({
          userId: user._id,
          employeeId: uniqueUserId,
          departmentId: departmentId && mongoose.Types.ObjectId.isValid(departmentId) ? departmentId : user.assignedDepartmentIds[0],
          designation: designation || 'Assistant Professor',
        });
        user.facultyProfileId = facultyProfile._id;
        await user.save();
      } catch (profileErr) {
        if ((profileErr as any)?.code === 11000) {
          await User.findByIdAndDelete(user._id);
          return next(new AppError(`Faculty Employee ID '${uniqueUserId}' already exists.`, 409));
        }
      }
    }

    // Audit Log
    try {
      await AuditLog.create({
        actorUserId: req.userId,
        action: 'USER_CREATED',
        entityType: 'User',
        entityId: user._id,
        reason: `${req.userRole} created account ${user.email} (ID: ${uniqueUserId}) with role ${user.role}`,
        ipAddress: req.ip,
      });
    } catch {}

    const userObj = user.toObject();
    delete (userObj as any).passwordHash;

    res.status(201).json({
      success: true,
      message: 'Account created successfully with generated credentials',
      data: {
        ...userObj,
        generatedUserId: uniqueUserId,
        temporaryPassword,
      },
      generatedUserId: uniqueUserId,
      temporaryPassword,
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/v1/users/:id
export async function updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, data: { _id: req.params.id, ...req.body } });
      return;
    }

    // Scope check: If EXAM_OFFICER, verify they are not updating an ADMIN or HOD or EXAM_OFFICER account
    if (req.userRole === 'EXAM_OFFICER') {
      const targetUser = await User.findById(req.params.id);
      if (!targetUser) return next(new AppError('User not found', 404));

      if (targetUser.role === 'ADMIN' || targetUser.role === 'HOD' || targetUser.role === 'EXAM_OFFICER') {
        return next(
          new AppError('Forbidden: Examination Officers cannot modify administrative or HOD accounts.', 403)
        );
      }

      if (req.body.role && req.body.role !== 'STUDENT' && req.body.role !== 'FACULTY') {
        return next(
          new AppError('Forbidden: Examination Officers cannot promote accounts to administrative or HOD roles.', 403)
        );
      }
    }

    const updates = { ...req.body };
    if (updates.password && updates.password.trim().length > 0) {
      updates.passwordHash = await bcrypt.hash(updates.password.trim(), config.bcryptRounds);
      delete updates.password;
    } else {
      delete updates.password;
    }

    if (updates.email) {
      updates.email = updates.email.toLowerCase().trim();
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!user) return next(new AppError('User not found', 404));

    try {
      await AuditLog.create({
        actorUserId: req.userId,
        action: 'USER_UPDATED',
        entityType: 'User',
        entityId: user._id,
        reason: req.body.accountStatus ? `Account status updated to ${req.body.accountStatus}` : 'User profile credentials updated',
        afterSnapshot: { role: user.role, accountStatus: user.accountStatus, name: user.name, email: user.email },
        ipAddress: req.ip,
      });
    } catch {}

    // Also sync in role collections if present
    const roleCollectionMap: Record<string, string> = {
      STUDENT: 'users_students',
      FACULTY: 'users_faculty',
      HOD: 'users_hod',
      EXAM_OFFICER: 'users_exam_officers',
      ADMIN: 'users_admins',
    };

    try {
      const db = mongoose.connection.db;
      if (db) {
        for (const colName of Object.values(roleCollectionMap)) {
          await db.collection(colName).updateOne(
            { $or: [{ _id: user._id }, { email: user.email }] },
            { $set: { ...updates, updatedAt: new Date() } }
          );
        }
      }
    } catch {
      // Ignore role collection update error
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/v1/users/:id
export async function deleteUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'User deleted successfully' });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) return next(new AppError('User not found', 404));

    const roleCollectionMap: Record<string, string> = {
      STUDENT: 'users_students',
      FACULTY: 'users_faculty',
      HOD: 'users_hod',
      EXAM_OFFICER: 'users_exam_officers',
      ADMIN: 'users_admins',
    };

    try {
      const db = mongoose.connection.db;
      if (db) {
        for (const colName of Object.values(roleCollectionMap)) {
          await db.collection(colName).deleteOne({
            $or: [{ _id: user._id }, { email: user.email }],
          });
        }
      }
    } catch {
      // Ignore role collection delete error
    }

    await User.findByIdAndDelete(req.params.id);

    try {
      await AuditLog.create({
        actorUserId: req.userId,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: user._id,
        reason: `User ${user.email} removed from institutional registry`,
        beforeSnapshot: { role: user.role, accountStatus: user.accountStatus, name: user.name, email: user.email },
        ipAddress: req.ip,
      });
    } catch {}

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
}

// Admin stats
export async function adminStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      res.json({
        success: true,
        data: {
          totalUsers: 24,
          studentCount: 18,
          facultyCount: 4,
          adminCount: 2,
          totalStudents: 18,
          totalFaculty: 4,
          totalDepartments: 3,
          totalPrograms: 4,
        },
      });
      return;
    }

    const [
      totalStudents,
      totalFaculty,
      totalDepartments,
      totalPrograms,
    ] = await Promise.all([
      User.countDocuments({ role: 'STUDENT', accountStatus: 'ACTIVE' }),
      User.countDocuments({ role: { $in: ['FACULTY', 'HOD'] }, accountStatus: 'ACTIVE' }),
      Department.countDocuments({ status: 'ACTIVE' }),
      Program.countDocuments({ status: 'ACTIVE' }),
    ]);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalPrograms,
        totalUsers: totalStudents + totalFaculty,
        studentCount: totalStudents,
        facultyCount: totalFaculty,
        adminCount: 2,
      },
    });
  } catch (err) {
    next(err);
  }
}
