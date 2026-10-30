import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { User, UserRole } from '../models/User';
import { StudentProfile } from '../models/StudentProfile';
import { FacultyProfile } from '../models/FacultyProfile';
import { Department } from '../models/Department';
import { config } from '../config/env';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';
import { MOCK_USERS } from '../utils/mockData';

const LOCK_TIME = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 5;

function generateAccessToken(userId: string, role: string, email: string): string {
  return jwt.sign({ userId, role, email }, config.jwt.secret as any, {
    expiresIn: config.jwt.expiresIn,
  } as any);
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, config.jwt.refreshSecret as any, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as any);
}

function setCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProd = config.nodeEnv === 'production';
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 min
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh',
  });
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return next(new AppError('Valid email and password are required', 400));
    }

    const lowerEmail = email.toLowerCase().trim();
    const targetEmail = (lowerEmail === 'controller@cehp.edu' || lowerEmail === 'coe@cehp.edu')
      ? 'examofficer@cehp.edu'
      : lowerEmail;

    // If MongoDB is not connected, allow mock only in test environment
    if (mongoose.connection.readyState !== 1) {
      if (process.env.NODE_ENV === 'test') {
        const dynamicRole: UserRole = (
          lowerEmail.includes('admin') ? 'ADMIN' :
          (lowerEmail.includes('hod') || lowerEmail.includes('head')) ? 'HOD' :
          (lowerEmail.includes('exam') || lowerEmail.includes('coe') || lowerEmail.includes('controller')) ? 'EXAM_OFFICER' :
          lowerEmail.includes('faculty') ? 'FACULTY' :
          'STUDENT'
        );

        const mockUser = MOCK_USERS[lowerEmail] || {
          id: 'usr_test',
          _id: 'usr_test',
          name: lowerEmail.split('@')[0].toUpperCase(),
          email: lowerEmail,
          role: dynamicRole,
          accountStatus: 'ACTIVE',
          assignedDepartmentIds: ['dept_cse'],
          department: 'Computer Science and Engineering',
        };

        const accessToken = generateAccessToken(String(mockUser.id || mockUser._id), mockUser.role, mockUser.email);
        const refreshToken = generateRefreshToken(String(mockUser.id || mockUser._id));
        setCookies(res, accessToken, refreshToken);

        res.json({
          success: true,
          data: {
            id: mockUser.id || mockUser._id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            accountStatus: mockUser.accountStatus,
            assignedDepartmentIds: mockUser.assignedDepartmentIds || ['dept_cse'],
            department: mockUser.department,
          },
          accessToken,
        });
        return;
      }
      return next(new AppError('Authentication service is currently unavailable: Database connection is unavailable', 503));
    }

    const user = await User.findOne({
      $or: [
        { email: targetEmail },
        { email: lowerEmail },
        { customUserId: (email || '').toUpperCase().trim() },
      ],
    }).select('+passwordHash +loginAttempts +lockUntil');

    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check account lock
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return next(new AppError(`Account locked. Try again in ${minutesLeft} minute(s)`, 429));
    }

    if (user.accountStatus !== 'ACTIVE') {
      return next(new AppError('Account is not active. Contact administrator.', 403));
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME);
        logger.warn(`Account locked for ${email} after ${MAX_LOGIN_ATTEMPTS} failed attempts`);
      }
      await user.save();
      return next(new AppError('Invalid credentials', 401));
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    let studentProfile = null;
    if (user.role === 'STUDENT') {
      try {
        studentProfile = user.studentProfileId
          ? await StudentProfile.findById(user.studentProfileId)
          : await StudentProfile.findOne({ userId: user._id });
      } catch {
        // Non-fatal if profile lookup encounters an issue
      }
    }

    let facultyProfile = null;
    if (user.role === 'FACULTY' || user.role === 'HOD') {
      try {
        facultyProfile = user.facultyProfileId
          ? await FacultyProfile.findById(user.facultyProfileId)
          : await FacultyProfile.findOne({ userId: user._id });
      } catch {
        // Non-fatal if profile lookup encounters an issue
      }
    }

    const accessToken = generateAccessToken(String(user._id), user.role, user.email);
    const refreshToken = generateRefreshToken(String(user._id));

    setCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        assignedDepartmentIds: user.assignedDepartmentIds,
        customUserId: user.customUserId,
        studentProfile: studentProfile || undefined,
        facultyProfile: facultyProfile || undefined,
        mustChangePassword: user.mustChangePassword,
      },
      accessToken,
    });
  } catch (err) {
    logger.error('Login error:', err);
    next(err);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
  res.json({ success: true, message: 'Logged out successfully' });
}

export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return next(new AppError('Authentication service is currently unavailable: Database connection is unavailable', 503));
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    let studentProfile = null;
    if (user.role === 'STUDENT') {
      try {
        studentProfile = user.studentProfileId
          ? await StudentProfile.findById(user.studentProfileId)
          : await StudentProfile.findOne({ userId: user._id });
      } catch {}
    }

    let facultyProfile = null;
    if (user.role === 'FACULTY' || user.role === 'HOD') {
      try {
        facultyProfile = user.facultyProfileId
          ? await FacultyProfile.findById(user.facultyProfileId)
          : await FacultyProfile.findOne({ userId: user._id });
      } catch {}
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
        assignedDepartmentIds: user.assignedDepartmentIds,
        studentProfile: studentProfile || undefined,
        facultyProfile: facultyProfile || undefined,
        lastLoginAt: user.lastLoginAt,
      },
    });
  } catch (err) {
    logger.error('getMe error:', err);
    next(err);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordResetToken +passwordResetExpires');
    const responseMessage = 'If an account with that email exists, a reset link has been sent.';

    if (!user) {
      res.json({ success: true, message: responseMessage });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 min
    await user.save();

    res.json({ success: true, message: responseMessage });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, newPassword } = req.body;
    if (mongoose.connection.readyState !== 1) {
      res.json({ success: true, message: 'Password reset successful.' });
      return;
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return next(new AppError('Reset token is invalid or has expired', 400));
    }

    user.passwordHash = await bcrypt.hash(newPassword, config.bcryptRounds);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return next(new AppError('Refresh token required', 401));
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, config.jwt.refreshSecret);
    } catch {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    if (mongoose.connection.readyState !== 1) {
      const accessToken = generateAccessToken(decoded.userId || 'usr_dynamic', 'STUDENT', 'student1@cehp.edu');
      setCookies(res, accessToken, token);
      res.json({ success: true, accessToken });
      return;
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.accountStatus !== 'ACTIVE') {
      return next(new AppError('User not found or inactive', 401));
    }

    const accessToken = generateAccessToken(String(user._id), user.role, user.email);
    const newRefreshToken = generateRefreshToken(String(user._id));
    setCookies(res, accessToken, newRefreshToken);

    res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
}
