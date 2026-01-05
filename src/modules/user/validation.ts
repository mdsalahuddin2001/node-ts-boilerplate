import { idSchema } from '@/libraries/utils/zod-validations';
import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string({}).min(1, 'Name is required'),
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});
export const registerVendorSchema = z.object({
  name: z.string({}).min(1, 'Name is required'),
  email: z.email('Provide a valid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  shopName: z.string({}).min(1, 'Shop name is required'),
  description: z.string({}).min(1, 'Description is required'),
  address: z.string({}).min(1, 'Address is required'),
});

export const updateMeSchema = z.object({
  name: z.string().optional(),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Old password is required'),
    newPassword: z.string().min(1, 'New password is required'),
  })
  .refine(data => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from old password',
    path: ['newPassword'],
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
