// src/domains/file/schema.ts
import mongoose, { Model, Schema } from 'mongoose';
import { baseSchema } from '@/libraries/db/base-schema';
import configs from '@/configs';

export interface IFile {
  _id?: string;
  filename: string;
  mimeType: string;
  size: number;
  key: string;
  uploadedBy?: string;
  metadata?: Record<string, string | number | boolean>;
  createdAt?: Date;
  updatedAt?: Date;
  isTemporary?: boolean;
}

const fileSchema = new Schema({
  filename: {
    type: String,
    required: true,
    trim: true,
    unique: false,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
    min: 0,
  },
  key: {
    type: String,
    required: true,
    unique: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  isTemporary: {
    type: Schema.Types.Boolean,
    default: true,
  },
});

fileSchema.add(baseSchema);
// Indexes

fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ key: 1 }, { unique: true });

fileSchema.virtual('url').get(function () {
  const baseUrl = `https://${configs.AWS_S3_BUCKET}.s3.${configs.AWS_S3_REGION}.amazonaws.com`;
  return `${baseUrl}/${this.key}`;
});

fileSchema.set('toJSON', { virtuals: true });
fileSchema.set('toObject', { virtuals: true });

const FileModel: Model<IFile> = mongoose.model<IFile>('File', fileSchema);

export default FileModel;
