import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 2000,
      socketTimeoutMS: 10000,
    });
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.warn(`⚠️ MongoDB connection not available at ${config.mongodbUri}. Server continuing in standby mode.`);
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});
