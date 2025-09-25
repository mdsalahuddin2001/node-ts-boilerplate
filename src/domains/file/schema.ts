// src/domains/file/schema.ts
import mongoose, { Model, Schema } from 'mongoose';
import { baseSchema } from '@/libraries/db/base-schema';

export interface IFile {
  _id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  key: string;
  bucker: string;
  url: string;
  uploadedBy?: string;
  metadata?: Record<string, string | number | boolean>;
  isPublic: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const fileSchema = new Schema({
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  fileName: {
    type: String,
    required: true,
    trim: true,
    unique: true,
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
  bucker: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
});

fileSchema.add(baseSchema);
// Indexes
fileSchema.index({ fileName: 1 });
fileSchema.index({ mimeType: 1 });
fileSchema.index({ uploadedBy: 1 });
fileSchema.index({ tags: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ key: 1 }, { unique: true });

const FileModel: Model<IFile> = mongoose.model<IFile>('File', fileSchema);

export default FileModel;
