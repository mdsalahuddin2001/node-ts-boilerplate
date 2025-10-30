import { Worker } from 'bullmq';
import { redisConnection } from '@/libraries/redis';
import FileModel from '@/modules/file/schema';
import logger from '@/libraries/log/logger';

export const fileWorker = new Worker(
  'fileQueue',
  async job => {
    logger.info(`FILE WORKER - [BullMQ] Processing job ${job.name} with data:`, job.data);

    try {
      if (!Array.isArray(job.data) || job.data.length === 0) {
        logger.warn('No file IDs provided for update');
        return;
      }

      // Update all matching file documents
      const result = await FileModel.updateMany(
        { _id: { $in: job.data } },
        { $set: { isTemporary: false } }
      );

      logger.info(`FILE WORKER - Updated ${result.modifiedCount} files successfully.`);
    } catch (error) {
      logger.error('FILE WORKER - Error while updating files:', error);
      throw error; // ensures BullMQ marks the job as failed
    }
  },
  { connection: redisConnection }
);

// Global error handling
fileWorker.on('failed', (job, err) => {
  logger.error(`FILE WORKER - [BullMQ] Job ${job?.name} failed:`, err);
});
