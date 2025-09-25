import mongoose, { Model, Schema } from 'mongoose';
import { baseSchema } from '../../libraries/db/base-schema';

// Define an interface for the Product document
export interface ICategory extends Document {
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  type?: string;
  parentId?: string;
  createdBy?: mongoose.Schema.Types.ObjectId;
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
  icon: {
    type: String,
  },
  image: {
    type: String,
  },
  type: {
    type: String,
  },

  parentId: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    //   required: true,
  },
});
categorySchema.add(baseSchema);

// Create and export the model
const CategoryModel: Model<ICategory> = mongoose.model<ICategory>('ICategory', categorySchema);

export default CategoryModel;
