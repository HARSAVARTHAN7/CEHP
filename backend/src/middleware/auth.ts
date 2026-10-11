import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config/env';
import { User, UserRole } from '../models/User';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: UserRole;
  userEmail?: string;
}

interface JwtPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    // Try cookie first, then Authorization header
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new AppError('Authentication required', 401));
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    return next(new AppError('Invalid token', 401));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(new AppError('Forbidden: Insufficient permissions', 403));
    }
    next();
  };
}

export async function requireActiveAccount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return next();
    }
    const user = await User.findById(req.userId).select('accountStatus');
    if (!user || user.accountStatus !== 'ACTIVE') {
      return next(new AppError('Account is not active', 403));
    }
    next();
  } catch (err) {
    next(err);
  }
}
