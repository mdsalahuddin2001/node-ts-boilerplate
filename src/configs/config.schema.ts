import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  RATE: z.coerce.number().min(0, 'RATE must be >= 0'),
  PORT: z.coerce.number().min(1000).default(4000),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'ACCESS_TOKEN_SECRET is required'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
  ACCESS_TOKEN_EXPIRATION: z.string().min(1, 'ACCESS_TOKEN_EXPIRATION is required'),
  REFRESH_TOKEN_EXPIRATION: z.string().min(1, 'REFRESH_TOKEN_EXPIRATION is required'),
});

export default schema;
