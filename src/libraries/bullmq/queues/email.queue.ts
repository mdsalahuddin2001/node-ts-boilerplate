import { Queue } from 'bullmq';
import { redisConnection } from '@/libraries/redis';

export const emailQueue = new Queue('emailQueue', { connection: redisConnection });
