// src/crons/utils/cron-logger.ts
import logger from '@/libraries/log/logger';

export const cronLogger = (jobName: string, message: string) => {
  logger.info(`[CRON][${jobName}] ${message}`);
};
