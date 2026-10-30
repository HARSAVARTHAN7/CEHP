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
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
}));

app.use(cors({
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'x-request-id'],
  exposedHeaders: ['Set-Cookie'],
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
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        connectDB(1),
        new Promise((resolve) => {
          timer = setTimeout(resolve, 2000);
          if (timer.unref) timer.unref();
        }),
      ]);
    } catch {
      // Standby mode
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  next();
});

// Health check
const healthCheckHandler = async (_req: express.Request, res: express.Response) => {
  const state = mongoose.connection.readyState;
  const dbStatus = state === 1 ? 'connected' : state === 2 ? 'connecting' : 'disconnected';
  let collectionsCount = 0;
  if (state === 1 && mongoose.connection.db) {
    try {
      const cols = await mongoose.connection.db.listCollections().toArray();
      collectionsCount = cols.length;
    } catch {}
  }

  res.json({
    status: 'ok',
    database: dbStatus,
    databaseName: mongoose.connection.name || null,
    collectionsCount,
    hasMongoUriEnv: Boolean(process.env.MONGODB_URI || process.env.MONGO_URI),
    timestamp: new Date().toISOString(),
    service: 'CEHP Backend',
  });
};
app.get('/health', healthCheckHandler);
app.get('/api/v1/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

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

// Export Express app for both CommonJS and ES module environments
(app as any).default = app;
module.exports = app;
export default app;
