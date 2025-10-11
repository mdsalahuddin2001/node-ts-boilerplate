import { z } from 'zod';
import mongoose from 'mongoose';
const createSchema = z.object({
  name: z.string({}).min(1, 'Name is required'),
  description: z.string().optional(),
  image: z.string().optional(),
});
const deleteSchema = z.object({
  id: z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID',
  }),
});

export { createSchema, deleteSchema };
