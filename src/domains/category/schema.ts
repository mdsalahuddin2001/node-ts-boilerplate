import mongoose, { Schema, Document, Model } from 'mongoose';
import { baseSchema } from '../../libraries/db/base-schema';

// Define an interface for the Product document
export interface ICategory extends Document {
  name: string;
  description?: string;
  parentId?: string | null;
  image?: string;
}

// Create the schema with TypeScript
const categorySchema = new Schema<ICategory>({
  name: { type: String, required: true },
  description: { type: String },
  parentId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'Category' },
  image: { type: mongoose.Schema.Types.ObjectId, default: null, ref: 'File' },
});

// Add the base schema properties
categorySchema.add(baseSchema);

// Create and export the model
const CategoryModel: Model<ICategory> = mongoose.model<ICategory>('Category', categorySchema);

export default CategoryModel;
