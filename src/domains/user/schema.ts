import bcrypt from 'bcrypt';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { baseSchema } from '../../libraries/db/base-schema';

// Define an interface for the Product document
export interface IUser extends Document {
  name: string;
  email: string;
  role: 'admin' | 'user';
  password: string;
}

// Create the schema with TypeScript
const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  role: { type: String, required: true, enum: ['admin', 'user'] },
  password: { type: String, required: true },
});

// Add the base schema properties
userSchema.add(baseSchema);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Only hash if changed
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Create and export the model
const UserModel: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default UserModel;
