// src/crons/index.ts
import { connectWithMongoDb } from '@/libraries/db';
import { startCronJobs } from './runners/scheduler';
import logger from '@/libraries/log/logger';

(async (): Promise<void> => {
  try {
    await connectWithMongoDb();
    startCronJobs();
    logger.info('🕒 Cron Service running...');
  } catch (err) {
    logger.error('Failed to start cron jobs', err);
    process.exit(1);
  }
})();
