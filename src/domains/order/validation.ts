import { idSchema } from '@/libraries/utils/zod-validations';
import { z } from 'zod';

// Order Item schema
export const orderItemSchema = z.object({
  product: idSchema,
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// Shipping Address schema
export const shippingAddressSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.email('Invalid email').optional(),
  address: z.string().min(1, 'Address is required'),
  district: z.string().min(1, 'District is required'),
  upazila: z.string().min(1, 'Upazila is required'),
});

// Main Order schema
export const createSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  shippingAddress: shippingAddressSchema,
  status: z
    .enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
    .default('pending'),
  paymentMethod: z.enum(['cod', 'celfin', 'bkash', 'nagad', 'ibbl']),
  transactionId: z.string().optional(),
  deliveryZone: z.enum(['outside_dhaka', 'inside_dhaka']),
});

// Type inference
export type OrderInput = z.infer<typeof createSchema>;

export const getByIdSchema = idSchema;
