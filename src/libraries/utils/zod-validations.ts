import mongoose from 'mongoose';
import { z } from 'zod';

export const idSchema = z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId',
});
