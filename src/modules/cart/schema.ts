import mongoose, { Model, Schema, Document } from 'mongoose';
import { baseSchema } from '@/libraries/db/base-schema';

// Define interface for cart item
export interface ICartItem {
  product: mongoose.Schema.Types.ObjectId;
  quantity: number;
  price: number;
}

// Define an interface for the Cart document
export interface ICart extends Document {
  user?: mongoose.Schema.Types.ObjectId;
  sessionId?: string;
  items: ICartItem[];
  subtotal: number;
  status: 'active' | 'abandoned' | 'converted';
}

// Cart item sub-schema
const cartItemSchema = new Schema<ICartItem>({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
  },
  price: {
    type: Number,
    required: true,
  },
});

// Create the cart schema
const cartSchema = new Schema<ICart>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true, // Allows null values and creates sparse index
  },
  sessionId: {
    type: String,
    sparse: true, // For guest users
  },
  items: [cartItemSchema],
  subtotal: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'abandoned', 'converted'],
  },
});

// Add the base schema properties
cartSchema.add(baseSchema);

// Indexes for better query performance
cartSchema.index({ user: 1, status: 1 });
cartSchema.index({ sessionId: 1, status: 1 });

// Ensure either user or sessionId exists
cartSchema.pre('save', function (next) {
  if (!this.user && !this.sessionId) {
    next(new Error('Either user or sessionId must be provided'));
  } else {
    next();
  }
});

// Create and export the model
const CartModel: Model<ICart> = mongoose.model<ICart>('Cart', cartSchema);

export default CartModel;
