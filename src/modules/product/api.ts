import express, { NextFunction, Request, Response } from 'express';
import logger from '../../libraries/log/logger';
import { create, deleteById, getById, search, updateById } from './service';

import { NotFoundError } from '@/libraries/error-handling';
import { paginatedSuccessResponse, successResponse } from '@/libraries/utils/sendResponse';
import { validateBody, validateParams, validateQuery } from '@/middlewares/request-validate';
import { logRequest } from '../../middlewares/log';
import { createSchema, deleteSchema, searchQuerySchema, updateSchema } from './validation';

const model: string = 'Product';

// CRUD for entity
const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  /*
  [GET] /api/v1/products - Get All Products - Public
  */
  router.get(
    '/',
    logRequest({}),
    validateQuery(searchQuerySchema),
    async (req: Request, res: Response, _next: NextFunction) => {
      const query = searchQuerySchema.parse(req.query);
      const data = await search(query);
      paginatedSuccessResponse(res, { data });
    }
  );

  /*
  [POST] /api/v1/products - Create a Product - Admin
  */
  router.post(
    '/',
    logRequest({}),
    validateBody(createSchema),
    async (req: Request, res: Response) => {
      // const body = pick(req.body, [
      //   'name',
      //   'slug',
      //   'sku',
      //   'price',
      //   'description',
      //   'category',
      //   'stock',
      //   'thumbnail',
      //   'gallery',
      // ]);

      const body = createSchema.parse(req.body);

      const data = await create(body);
      successResponse(res, {
        data,
        statusCode: 201,
      });
    }
  );

  /*[GET] /api/v1/products/:id - Get a Product by ID - Public*/
  router.get('/:id', logRequest({}), async (req: Request, res: Response, _next: NextFunction) => {
    const data = await getById(req.params.id);
    if (!data) {
      throw new NotFoundError(`${model} not found`, `domain/product/api.ts - /:id`);
    }
    successResponse(res, { data });
  });

  /* =================================================
  PATCH - /api/v1/products/:id - Update a Product by ID - Admin
  ====================================================*/
  router.patch(
    '/:id',
    logRequest({}),
    validateBody(updateSchema),
    async (req: Request, res: Response) => {
      const item = await updateById(req.params.id, req.body);
      if (!item) {
        throw new NotFoundError(`${model} not found`, `domain/product/api.ts - PATCH /:id`);
      }
      successResponse(res, { data: item, message: 'Product updated successfully' });
    }
  );

  /* =================================================
  DELETE - /api/v1/products/:id - Delete a Product by ID - Admin
  ====================================================*/
  router.delete(
    '/:id',
    logRequest({}),
    validateParams(deleteSchema),
    async (req: Request, res: Response) => {
      const deletedItem = await deleteById(req.params.id);
      if (!deletedItem) {
        throw new NotFoundError(`${model} not found`, `domain/product/api.ts - DELETE /:id`);
      }
      successResponse(res, { data: deletedItem, message: 'Product deleted successfully' });
    }
  );

  return router;
};

export { routes };
