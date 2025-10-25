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
  logger.info(`Setting up routes for cart`);

  /* =================================================
  GET - /api/v1/cart - Search cart - Admin
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
  POST - /api/v1/cart - Create cart - Admin
  ====================================================*/
  router.post(
    '/',
    authenticate,
    authorize('admin'),
    validateBody(createSchema),
    logRequest({}),
    async (req: Request, res: Response) => {
      const item = await create(req.body);
      successResponse(res, { data: item });
    }
  );

  /* =================================================
  GET - /api/v1/cart:id - Get cart by ID
  ====================================================*/
  router.get(
    '/:id',
    authenticate,
    logRequest({}),
    validateParams(deleteSchema),
    async (req: Request, res: Response) => {
      const item = await getById(req.params.id);
      if (!item) {
        throw new NotFoundError(`cart not found`, `domain/cart/api.ts - /:id`);
      }
      successResponse(res, { data: item });
    }
  );

  /* =================================================
  PATCH - /api/v1/cart:id - Update cart by ID - Admin
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
        throw new NotFoundError(`cart not found`, `domain/cart/api.ts - /:id`);
      }
      successResponse(res, { data: item });
    }
  );

  /* =================================================
  DELETE - /api/v1/cart:id - Delete cart by ID - Admin
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
        throw new NotFoundError(`cart not found`, `domain/cart/api.ts - /:id`);
      }
      successResponse(res, { data: item });
    }
  );

  return router;
};

export { routes };
