import { z } from 'zod';

const loginSchema = z.object({
  email: z.email('Invalid email format').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

// Type inference
type User = z.infer<typeof loginSchema>;

export { loginSchema, type User };
