import express, { NextFunction, Request, Response } from 'express';
import logger from '../../libraries/log/logger';

// import { createSchema, updateSchema, idSchema } from './request';
// import { validateRequest } from '../../middlewares/request-validate';
import { BadRequestError, ServerError } from '@/libraries/error-handling';
import { logRequest } from '../../middlewares/log';
import { upload } from '@/middlewares/upload';
import { uploadToS3 } from '@/libraries/aws/s3';
import { create } from './service';
import { generateFileName } from '@/libraries/utils/string';
import { successResponse } from '@/libraries/utils/sendResponse';

const model: string = 'Product';

// CRUD for entity
const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  router.post(
    '/single-any',
    logRequest({}),
    upload({ allowMultiple: false, fieldName: 'file' }),
    // validateRequest({ schema: createSchema }),
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.file) {
        logger.error('No file uploaded');
        throw new BadRequestError('No file uploaded', 'domain/file/api.ts - POST /single-any');
      }
      try {
        const key = generateFileName(req.file.originalname);
        const uploadParams = {
          key,
          body: req.file.buffer,
          contenttype: req.file.mimetype,
        };
        const result = await uploadToS3(uploadParams);
        const data = await create(result);
        successResponse(res, { data });
      } catch (error) {
        // @TODO: Implement Delete File From S3
        logger.error('File Upload Request Failed', error);
        throw new ServerError('File Upload Request Failed', '/single any catch block');
      }
    }
  );

  return router;
};

export { routes };
