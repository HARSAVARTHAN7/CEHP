import app from './app';
import { config } from './config/env';
import { connectDB } from './config/database';
import { logger } from './utils/logger';

// Export app as default and CommonJS for Vercel Serverless Functions
(app as any).default = app;
module.exports = app;
export default app;

// Only bind HTTP port when running standalone (local dev / Docker), not inside Vercel serverless functions
if (!process.env.VERCEL) {
  async function startServer(): Promise<void> {
    try {
      const server = app.listen(config.port, '0.0.0.0', () => {
        logger.info(`🚀 CEHP Backend running on http://localhost:${config.port}`);
        logger.info(`📋 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Frontend: ${config.frontendOrigin}`);
      });

      // Connect to database in background
      connectDB().catch((err) => {
        logger.warn('Initial MongoDB connection deferred or failed:', err?.message || err);
      });

      // Graceful shutdown
      const shutdown = async (signal: string) => {
        logger.info(`\n${signal} received. Shutting down gracefully...`);
        server.close(() => {
          logger.info('HTTP server closed');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  startServer();
}
