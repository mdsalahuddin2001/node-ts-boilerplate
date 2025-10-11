import { z } from 'zod';

export const fileUploadValidation = {
  // Validate file upload request
  upload: z.object({
    isPublic: z.boolean().default(false),
    tags: z.array(z.string().trim().max(50)).max(10).default([]),
    metadata: z.record(z.string(), z.any()).default({}),
    folder: z.string().trim().max(100).optional(),
  }),

  // Validate file query parameters
  list: z.object({
    uploadedBy: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/)
      .optional(),
    mimeType: z.string().max(100).optional(),
    tags: z
      .union([z.string().transform(val => [val]), z.array(z.string().trim().max(50))])
      .optional(),
    isPublic: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    page: z.coerce.number().int().min(1).default(1),
    sortBy: z.enum(['createdAt', 'updatedAt', 'originalName', 'size']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),

  // Validate file update request
  update: z.object({
    tags: z.array(z.string().trim().max(50)).max(10).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    isPublic: z.boolean().optional(),
  }),

  // Validate download URL request
  downloadUrl: z.object({
    expiresIn: z.coerce.number().int().min(60).max(86400).default(3600), // 1 minute to 24 hours
  }),
};

// Type exports for TypeScript
export type FileUploadInput = z.infer<typeof fileUploadValidation.upload>;
export type FileListQuery = z.infer<typeof fileUploadValidation.list>;
export type FileUpdateInput = z.infer<typeof fileUploadValidation.update>;
export type FileDownloadQuery = z.infer<typeof fileUploadValidation.downloadUrl>;

export const fileValidationRules = {
  // Maximum file size (50MB)
  maxFileSize: 50 * 1024 * 1024,

  // Allowed file types
  allowedMimeTypes: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',

    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/rtf',

    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip',

    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
    'audio/flac',

    // Video
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/ogg',

    // Others
    'application/json',
    'application/xml',
    'text/xml',
  ],

  // File name validation
  validateFileName: (fileName: string): boolean => {
    // Check for valid characters and reasonable length
    const nameRegex = /^[a-zA-Z0-9._\-\s()[\]]+$/;
    return nameRegex.test(fileName) && fileName.length <= 255;
  },

  // Check if file type is allowed
  isAllowedFileType: (mimeType: string): boolean => {
    return fileValidationRules.allowedMimeTypes.includes(mimeType);
  },

  // Get file category based on MIME type
  getFileCategory: (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (
      mimeType.startsWith('text/') ||
      mimeType.includes('document') ||
      mimeType === 'application/pdf'
    ) {
      return 'document';
    }
    if (
      mimeType.includes('zip') ||
      mimeType.includes('rar') ||
      mimeType.includes('tar') ||
      mimeType.includes('gzip')
    ) {
      return 'archive';
    }
    return 'other';
  },

  // Validate file size
  validateFileSize: (size: number): boolean => {
    return size > 0 && size <= fileValidationRules.maxFileSize;
  },

  // Generate safe file name
  generateSafeFileName: (originalName: string): string => {
    // Remove or replace unsafe characters
    let safeName = originalName;

    // Ensure reasonable length
    if (safeName.length > 100) {
      const extension = safeName.substring(safeName.lastIndexOf('.'));
      const nameWithoutExt = safeName.substring(0, safeName.lastIndexOf('.'));
      safeName = nameWithoutExt.substring(0, 100 - extension.length) + extension;
    }

    return safeName || 'unnamed_file';
  },
};
