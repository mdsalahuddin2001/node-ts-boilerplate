import { NotFoundError } from '@/libraries/error-handling';
import logger from '@/libraries/log/logger';
import { paginatedSuccessResponse, successResponse } from '@/libraries/utils/sendResponse';
import { authenticate, authorize } from '@/middlewares/auth';
import { logRequest } from '@/middlewares/log';
import { validateBody, validateParams } from '@/middlewares/request-validate';
import express, { Request, Response } from 'express';
import { create, deleteById, getById, search, updateById } from './service';
import { createSchema, deleteSchema, updateSchema } from './validation';

const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for vendor`);

  /* =================================================
  GET - /api/v1/vendors - Search vendor - Admin
  ====================================================*/
  router.get(
    '/',
    authenticate,
    authorize('admin'),
    logRequest({}),
    async (req: Request, res: Response) => {
      const data = await search(req.query);
      paginatedSuccessResponse(res, { data });
    }
  );

  /* =================================================
  POST - /api/v1/vendor - Create vendor - Admin
  ====================================================*/
  router.post(
    '/',
    authenticate,
    authorize('admin'),
    validateBody(createSchema),
    logRequest({}),
    async (req: Request, res: Response) => {
      const body = createSchema.parse(req.body);

      const item = await create({ ...body, role: 'vendor' });
      successResponse(res, { data: item });
    }
  );

  /* =================================================
  GET - /api/v1/vendor:id - Get vendor by ID
  ====================================================*/
  router.get(
    '/:id',
    authenticate,
    logRequest({}),
    validateParams(deleteSchema),
    async (req: Request, res: Response) => {
      const item = await getById(req.params.id);
      if (!item) {
        throw new NotFoundError(`vendor not found`, `domain/vendor/api.ts - /:id`);
      }
      successResponse(res, { data: item });
    }
  );
  /* =================================================
  PATCH - /api/v1/vendor/:id/status - Update vendor status by ID - Admin
  ====================================================*/
  router.patch(
    '/:id/status',
    authenticate,
    logRequest({}),
    validateParams(deleteSchema),
    async (req: Request, res: Response) => {
      const { status } = req.body;
      const item = await updateById(req.params.id, { status });
      if (!item) {
        throw new NotFoundError(`vendor not found`, `domain/vendor/api.ts - /:id`);
      }
      successResponse(res, { data: item });
    }
  );

  /* =================================================
  PATCH - /api/v1/vendor:id - Update vendor by ID - Admin
  ====================================================*/
  router.patch(
    '/:id',
    authenticate,
    authorize('admin'),
    validateBody(updateSchema),
    validateParams(deleteSchema),
    logRequest({}),
    async (req: Request, res: Response) => {
      const item = await updateById(req.params.id, req.body);
      if (!item) {
        throw new NotFoundError(`vendor not found`, `domain/vendors/api.ts - /:id`);
      }
      successResponse(res, { data: item });
    }
  );

  /* =================================================
  DELETE - /api/v1/vendor:id - Delete vendor by ID - Admin
  ====================================================*/
  router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    validateParams(deleteSchema),
    logRequest({}),
    async (req: Request, res: Response) => {
      const item = await deleteById(req.params.id);
      if (!item) {
        throw new NotFoundError(`vendor not found`, `domain/vendor/api.ts - /:id`);
      }
      successResponse(res, { data: item });
    }
  );

  return router;
};

export { routes };
