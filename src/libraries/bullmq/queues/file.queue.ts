import { Queue } from 'bullmq';
import { redisConnection } from '@/libraries/redis';

export const fileQueue = new Queue('fileQueue', { connection: redisConnection });
