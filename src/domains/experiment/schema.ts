import mongoose, { Schema } from 'mongoose';
import { baseSchema } from '../../libraries/db/base-schema';

// Define an interface for the Product document
export interface IModel extends Document {
  name: string;
}

const schema = new Schema<IModel>({
  name: { type: String, required: true }
  // other properties
});
schema.add(baseSchema);

// Create and export the model
const ProductModel: Model<IModel> = mongoose.model<IModel>(
  'IModel',
  productSchema
);

export default ProductModel;
