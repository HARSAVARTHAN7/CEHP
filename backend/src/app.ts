import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { connectDB } from './config/database';
import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import './models';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import academicRoutes from './routes/academicRoutes';
import resultRoutes from './routes/resultRoutes';
import notificationRoutes from './routes/notificationRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();

// Security
app.use(helmet({
  contentSecurityPolicy: false, // Allow frontend
}));

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serverless DB connection middleware
app.use(async (_req, _res, next) => {
  if (mongoose.connection.readyState === 0 && config.mongodbUri) {
    try {
      await connectDB();
    } catch {
      // Standby mode
    }
  }
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'CEHP Backend' });
});

// API routes
const prefixes = ['/api/v1', '/v1', '/api'];
prefixes.forEach((p) => {
  app.use(`${p}/auth`, authRoutes);
  app.use(`${p}/users`, userRoutes);
  app.use(`${p}`, academicRoutes);
  app.use(`${p}`, resultRoutes);
  app.use(`${p}/notifications`, notificationRoutes);
  app.use(`${p}/ai`, aiRoutes);
});

// Not found and error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
