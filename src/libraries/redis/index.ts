import configs from '@/configs';
import { RedisOptions } from 'ioredis';

export const redisConnection: RedisOptions = {
  host: configs.REDIS_HOST,
  port: Number(configs.REDIS_PORT || 6379),
  password: configs.REDIS_PASSWORD || undefined,
};
