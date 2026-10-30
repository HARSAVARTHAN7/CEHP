import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

let connectionPromise: Promise<void> | null = null;

export async function connectDB(retries = 1): Promise<void> {
  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await mongoose.connect(config.mongodbUri, {
          maxPoolSize: 5,
          serverSelectionTimeoutMS: 3000,
          connectTimeoutMS: 3000,
          socketTimeoutMS: 10000,
        });
        logger.info('✅ MongoDB connected successfully');
        return;
      } catch (error: any) {
        logger.warn(`⚠️ MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
    }
    logger.warn(`⚠️ MongoDB connection could not be established after ${retries} attempts. Server continuing in standby mode.`);
  })().finally(() => {
    connectionPromise = null;
  });

  return connectionPromise;
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NOW_REGION);

if (!isServerless) {
  mongoose.connection.on('disconnected', () => {
    logger.warn('⚠️ MongoDB disconnected. Attempting automatic reconnection...');
    const t = setTimeout(() => {
      connectDB(2).catch(() => {});
    }, 2000);
    if (t.unref) t.unref();
  });
}

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});
