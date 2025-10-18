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

  // AWS
  AWS_S3_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_S3_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_S3_REGION: z.string().min(1, 'AWS_REGION is required'),
  AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET_NAME is required'),
  // allowed MIME types for file uploads
  file: z.object({
    allowedMimeTypes: z.array(z.string()).default(['image/jpeg', 'image/png', 'image/gif']),
    maxFileSize: z.coerce.number().min(1, 'file.maxFileSize is required'),
  }),

  // Email
  email: z.object({
    secure: z.boolean(),
    from: z.email('Invalid SMTP from email').min(1, 'SMTP from email is required'),
    fromName: z.string().min(1, 'SMTP from name is required'),
  }),
});

export default schema;
