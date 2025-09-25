import configs from '@/configs';
import { createS3Client } from '@/libraries/aws/s3';
import { BadRequestError } from '@/libraries/error-handling';
import { generateFileName } from '@/libraries/utils/string';
import { lookup } from 'mime-types';
import multer from 'multer';
import multerS3 from 'multer-s3';
const s3 = createS3Client();

export const upload = (
  options: {
    maxFileSize?: number;
    allowMultiple?: boolean;
    fieldName?: string;
    direct?: boolean;
  } = {}
) => {
  const {
    maxFileSize = configs.file.maxFileSize,
    allowMultiple = false,
    fieldName = 'file',
    direct = false,
  } = options;

  const upload = multer({
    storage: !direct
      ? multer.memoryStorage()
      : multerS3({
          s3: s3,
          bucket: configs.AWS_S3_BUCKET,
          key: (_req, file, cb) => {
            const fileName = generateFileName(file.originalname);
            cb(null, fileName);
          },
          contentType: (_req, file, cb) => {
            const mimeType = lookup(file.originalname) || 'application/octet-stream';
            cb(null, mimeType);
          },
          metadata: (_req, file, cb) => {
            cb(null, {
              fieldName: file.fieldname,
              originalName: file.originalname,
              uploadedAt: new Date().toISOString(),
            });
          },
        }),
    limits: {
      fileSize: maxFileSize,
    },
    fileFilter: (_req, file, cb) => {
      if (file.fieldname !== fieldName) {
        cb(
          new BadRequestError(
            `Field name ${file.fieldname} does not match expected ${fieldName}`,
            'multer metadata callback'
          )
        );
        return;
      }

      //   If file type is not allowed
      if (configs.file.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new BadRequestError(
            `File type ${file.mimetype} is not allowed`,
            'multer file filter callback'
          )
        );
      }
    },
  });

  return allowMultiple
    ? upload.array(fieldName, 10) // Max 10 files
    : upload.single(fieldName);
};
