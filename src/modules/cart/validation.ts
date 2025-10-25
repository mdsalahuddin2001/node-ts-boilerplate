import { idSchema } from '@/libraries/utils/zod-validations';
import { z } from 'zod';

// Cart item schema
export const cartItemSchema = z.object({
  product: idSchema,
  quantity: z.number().int().positive('Quantity must be a positive number'),
});

// Add item to cart
export const addItemSchema = cartItemSchema;

// Update item quantity
export const updateItemSchema = cartItemSchema;

// Remove item from cart
export const removeItemSchema = z.object({
  product: idSchema,
});

// Get cart schema (optional filters)
export const getCartSchema = z.object({
  userId: idSchema.optional(),
});

// Clear cart
export const clearCartSchema = z.object({
  userId: idSchema.optional(),
});

export type CartItemType = z.infer<typeof cartItemSchema>;
export type AddItemType = z.infer<typeof addItemSchema>;
export type UpdateItemType = z.infer<typeof updateItemSchema>;
export type RemoveItemType = z.infer<typeof removeItemSchema>;
export type GetCartType = z.infer<typeof getCartSchema>;
export type ClearCartType = z.infer<typeof clearCartSchema>;
