import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string({}).min(1, 'Name is required'),
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Type inference
type User = z.infer<typeof createUserSchema>;

export { createUserSchema, type User };
