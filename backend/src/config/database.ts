import mongoose from 'mongoose';
import { config } from './env';
import { logger } from '../utils/logger';

let isConnecting = false;

export async function connectDB(retries = 3): Promise<void> {
  if (mongoose.connection.readyState === 1 || isConnecting) {
    return;
  }

  isConnecting = true;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(config.mongodbUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 20000,
        connectTimeoutMS: 20000,
        socketTimeoutMS: 45000,
      });
      logger.info('✅ MongoDB connected successfully');
      isConnecting = false;
      return;
    } catch (error: any) {
      logger.warn(`⚠️ MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  isConnecting = false;
  logger.warn(`⚠️ MongoDB connection could not be established after ${retries} attempts. Server continuing in standby mode.`);
}

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB error:', err);
});
