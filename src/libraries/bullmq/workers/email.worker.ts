import { Worker } from 'bullmq';
import { redisConnection } from '@/libraries/redis';

export const emailWorker = new Worker(
  'emailQueue',
  async job => {
    console.log(`EMAIL WORKER - [BullMQ] Processing job ${job?.name} with data:`, job?.data);
  },
  { connection: redisConnection }
);

// Global error handling
emailWorker.on('failed', (job, err) => {
  console.error(`EMAIL WORKER - [BullMQ] Job ${job?.name} failed:`, err);
});
