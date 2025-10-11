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
import FileModel from './schema';
import { paginatedSuccessResponse, successResponse } from '@/libraries/utils/sendResponse';
// import { aggregateWithPagination } from '@/libraries/query/aggregateWithPagination';
// import { PipelineStage } from 'mongoose';
import { QueryBuilder } from '@/libraries/query/QueryBuilder';

const model: string = 'Product';

const queryBuilder = new QueryBuilder({
  searchFields: ['filename', 'mimeType'],
  sortableFields: ['filename', 'key', 'mimeType', 'createdAt'],
});

// CRUD for entity
const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);
  /* =======================================
     [GET] /api/v1/files
     Description here
     ======================================= */
  router.get('/', async (req: Request, res: Response) => {
    console.log('req..qery', req.query);
    const data = await queryBuilder.query(FileModel, req.query).paginate().lean().execute();

    paginatedSuccessResponse(res, { data });

    // const pipeline: PipelineStage[] = [
    //   {
    //     $addFields: {
    //       url: {
    //         $concat: [
    //           'https://your-bucket.s3.amazonaws.com/', // Your base URL
    //           '$key',
    //         ],
    //       },
    //     },
    //   },
    // ];
    // const data = await aggregateWithPagination(
    //   FileModel,
    //   req.query,
    //   ['filename', 'mimeType', 'createdAt'],
    //   pipeline
    // );
    // paginatedSuccessResponse(res, { data });
  });

  /*
  [POST] /api/v1/upload-image-single - Description here - Private
  */
  router.post(
    '/upload-image-single',
    logRequest({}),
    upload({ allowMultiple: false, fieldName: 'file' }),
    // validateRequest({ schema: createSchema }),
    async (req: Request, res: Response, _next: NextFunction) => {
      if (!req.file) {
        logger.error('No file uploaded', req.file);
        throw new BadRequestError('No file uploaded', 'domain/file/api.ts - POST /single-any');
      }
      try {
        const key = generateFileName(req.file.originalname);
        const uploadParams = {
          key,
          body: req.file.buffer,
          contentType: req.file.mimetype,
        };
        const result = await uploadToS3(uploadParams);
        const data = await create({
          filename: req.file?.originalname,
          key: result.key,
          size: req.file?.size,
          mimeType: req.file?.mimetype,
          // uploadedBy: req.user?._id,
        });
        successResponse(res, { data });
      } catch (error) {
        // @TODO: Implement Delete File From S3
        logger.error('File Upload Request Failed', error);
        throw new ServerError('File Upload Request Failed', '/single any catch block');
      }
    }
  );

  /*
  [POST] /api/v1/upload-image-multiple - Description here - Private
  */
  router.post(
    '/upload-image-multiple',
    logRequest({}),
    upload({ allowMultiple: true, fieldName: 'files' }),
    async (req: Request, res: Response, _next: NextFunction) => {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        logger.error('No files uploaded', req.files);
        throw new BadRequestError(
          'No files uploaded',
          'domain/file/api.ts - POST /upload-image-multiple'
        );
      }

      try {
        const results = await Promise.all(
          files.map(async file => {
            const key = generateFileName(file.originalname);
            const uploadParams = {
              key,
              body: file.buffer,
              contentType: file.mimetype,
            };

            const result = await uploadToS3(uploadParams);

            const data = await create({
              filename: file.originalname,
              key: result.key,
              size: file.size,
              mimeType: file.mimetype,
              // uploadedBy: req.user?._id,
            });

            return data;
          })
        );

        successResponse(res, { data: results });
      } catch (error) {
        // @TODO: optionally delete uploaded files from S3 if partial failure
        logger.error('Multiple File Upload Request Failed', error);
        throw new ServerError(
          'Multiple File Upload Request Failed',
          '/upload-image-multiple catch block'
        );
      }
    }
  );

  return router;
};

export { routes };
