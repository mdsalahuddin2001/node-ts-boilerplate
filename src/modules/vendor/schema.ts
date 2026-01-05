import mongoose, { Model, Schema, Document } from 'mongoose';
import { baseSchema } from '@/libraries/db/base-schema';
import { IUser } from '../user/schema';

// Define an interface for the Vendor document
export interface IVendor extends Document {
  userId: mongoose.Schema.Types.ObjectId | IUser;
  shopName: string;
  description: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  // other fields here
}

const schema = new Schema<IVendor>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopName: { type: String, required: [true, 'Shop name is required'] },
  description: { type: String, required: [true, 'Description is required'] },
  address: { type: String, required: [true, 'Address is required'] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
});

// Add base schema (timestamps, etc.)
schema.add(baseSchema);

// Create and export the model
const VendorModel: Model<IVendor> = mongoose.model<IVendor>('Vendor', schema);

export default VendorModel;
