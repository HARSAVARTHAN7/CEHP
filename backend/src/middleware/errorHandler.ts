import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import { config } from '../config/env';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let errors: unknown[] | undefined;

  const requestId = (req.headers['x-request-id'] as string) || (req as any).id || (typeof crypto !== 'undefined' && (crypto as any).randomUUID ? (crypto as any).randomUUID() : `req-${Date.now()}`);

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode =
      err.statusCode === 401
        ? 'INVALID_TOKEN'
        : err.statusCode === 403
        ? 'FORBIDDEN'
        : err.statusCode === 404
        ? 'NOT_FOUND'
        : err.statusCode === 400
        ? 'BAD_REQUEST'
        : err.statusCode >= 500
        ? 'SERVER_ERROR'
        : 'APP_ERROR';
  } else if (err instanceof ZodError) {
    statusCode = 422;
    errorCode = 'VALIDATION_ERROR';
    const zodIssues = (err as any).issues || (err as any).errors || [];
    errors = zodIssues.map((e: any) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    errorCode = 'INVALID_IDENTIFIER';
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    errorCode = 'DATABASE_VALIDATION_ERROR';
    message = 'Database validation failed';
    errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if ((err as { code?: number }).code === 11000) {
    // MongoDB duplicate key
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    const field = Object.keys((err as { keyValue?: Record<string, unknown> }).keyValue || {})[0];
    message = `${field || 'Resource'} already exists`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Authentication token is invalid';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError') {
    statusCode = 503;
    errorCode = 'DATABASE_UNAVAILABLE';
    message = 'Database service is currently unreachable';
  }

  // Only log 5xx errors with full details
  if (statusCode >= 500) {
    logger.error(`[${requestId}] ${req.method} ${req.path} → ${statusCode}`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code: errorCode,
    requestId,
    errors,
    // Never expose stack in production
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}
