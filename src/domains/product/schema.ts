import mongoose, { Schema, Document, Model } from 'mongoose';
import { baseSchema } from '../../libraries/db/base-schema';

// Define an interface for the Product document
export interface IProduct extends Document {
  name: string;
  description: string;
  category: mongoose.Schema.Types.ObjectId;
  slug: string;
  sku: string;
  rating?: number;
  reviewCount?: number;
  price: number;
  stockQuantity: number;
  status: 'active' | 'inactive';
  deliveryZone: 'outside_dhaka' | 'inside_dhaka';
}

// Create the schema with TypeScript
const productSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  slug: { type: String, required: true, unique: true },
  sku: { type: String, required: true, unique: true },
  description: { type: String },
  price: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  stockQuantity: { type: Number, default: 0 },
  status: { type: String, default: 'active', enum: ['active', 'inactive'] },
  deliveryZone: { type: String, required: true, enum: ['outside_dhaka', 'inside_dhaka'] },
});

// Add the base schema properties
productSchema.add(baseSchema);

// Create and export the model
const ProductModel: Model<IProduct> = mongoose.model<IProduct>('Product', productSchema);

export default ProductModel;
