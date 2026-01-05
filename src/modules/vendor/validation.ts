import { z } from 'zod';
import { idSchema } from '@/libraries/utils/zod-validations';

// Create schema
export const createSchema = z.object({
  name: z.string({}).min(1, 'Name is required'),
  email: z.email('Provide a valid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
  shopName: z.string({}).min(1, 'Shop name is required'),
  description: z.string({}).min(1, 'Description is required'),
  address: z.string({}).min(1, 'Address is required'),
});

// Update schema (partial of create)
export const updateSchema = createSchema.partial();

// Delete schema (ID validation)
export const deleteSchema = z.object({
  id: idSchema,
});

// Query schema (generic for filtering, sorting, pagination, etc.)
export const searchQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.string().optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  select: z.string().optional(),
});

// Type inference helpers
export type CreateType = z.infer<typeof createSchema>;
export type UpdateType = z.infer<typeof updateSchema>;
export type DeleteType = z.infer<typeof deleteSchema>;
export type SearchQueryType = z.infer<typeof searchQuerySchema>;

// Reuse the idSchema for get-by-id endpoints
export const getByIdSchema = idSchema;
