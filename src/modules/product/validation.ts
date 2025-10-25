import { idSchema } from '@/libraries/utils/zod-validations';
import { z } from 'zod';

// Product Zod schema
export const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  category: idSchema,
  slug: z.string().min(1, 'Slug is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  price: z.number().nonnegative('Price must be a positive number'),
  rating: z.number().min(0).max(5).default(0).optional(),
  reviewCount: z.number().int().nonnegative().default(0).optional(),
  stockQuantity: z.number().int().nonnegative().default(0).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  thumbnail: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  // If your baseSchema includes common fields (like createdAt, updatedAt, deletedAt, etc.), add them here:
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const updateSchema = createSchema.partial();

// query schema
export const searchQuerySchema = z.object({
  search: z.string().optional(),
  sort: z.string().optional(),
  limit: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  select: z.string().optional(),
  category: idSchema.optional(),
  price: z
    .union([
      z.coerce.number(),
      z.object({
        lte: z.coerce.number().optional(),
        gte: z.coerce.number().optional(),
        lt: z.coerce.number().optional(),
        gt: z.coerce.number().optional(),
      }),
    ])
    .optional(),
});

export type SearchQueryType = z.infer<typeof searchQuerySchema>;
export type CreateType = z.infer<typeof createSchema>;
export type UpdateType = z.infer<typeof updateSchema>;

export const getByIdSchema = idSchema;
