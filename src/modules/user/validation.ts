import { idSchema } from '@/libraries/utils/zod-validations';
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string({}).min(1, 'Name is required'),
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const updateMeSchema = z.object({
  name: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(1, 'New password is required'),
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.email('Invalid email format').optional(),
  role: z.enum(['admin', 'user']).optional(),
});

export const deleteUserSchema = z.object({
  id: idSchema,
});
// Type inference
export type User = z.infer<typeof createUserSchema>;
