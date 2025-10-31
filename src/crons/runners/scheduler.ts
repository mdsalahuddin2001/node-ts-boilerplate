import logger from '@/libraries/log/logger';
import { cleanTempFilesCron } from '../jobs/clean-temp-files.cron';

export function startCronJobs(): void {
  cleanTempFilesCron.start();
  logger.info('✅ Cron jobs started successfully');
}
