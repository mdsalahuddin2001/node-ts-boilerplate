import mongoose, { Model, Schema, Document } from 'mongoose';
import { baseSchema } from '@/libraries/db/base-schema';

// Define an interface for the Cart document
export interface ICart extends Document {
  name: string;
  // other fields here
}

const schema = new Schema<ICart>({
  name: { type: String, required: true },
  // other schema properties here
});

// Add base schema (timestamps, etc.)
schema.add(baseSchema);

// Create and export the model
const CartModel: Model<ICart> = mongoose.model<ICart>('Cart', schema);

export default CartModel;
