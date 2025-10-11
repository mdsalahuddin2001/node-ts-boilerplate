import express, { NextFunction, Request, Response } from 'express';
import logger from '../../libraries/log/logger';
import { create, deleteById, getById, search, updateById } from './service';

import { NotFoundError } from '@/libraries/error-handling';
import { paginatedSuccessResponse, successResponse } from '@/libraries/utils/sendResponse';
import { validateBody } from '@/middlewares/request-validate';
import { logRequest } from '../../middlewares/log';
import { createSchema } from './validation';

const model: string = 'Product';

// CRUD for entity
const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  /*
  [GET] /api/v1/products - Get All Products - Public
  */
  router.get('/', logRequest({}), async (req: Request, res: Response, _next: NextFunction) => {
    const data = await search(req.query);
    paginatedSuccessResponse(res, { data });
  });

  /*
  [POST] /api/v1/orders - Create an Order - Public
  */
  router.post(
    '/',
    logRequest({}),
    validateBody(createSchema),
    async (req: Request, res: Response) => {
      const data = await create(req.body);
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

  router.put(
    '/:id',
    logRequest({}),
    // validateRequest({ schema: idSchema, isParam: true }),
    // validateRequest({ schema: updateSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const item = await updateById(req.params.id, req.body);
        if (!item) {
          throw new NotFoundError(`${model} not found`, `domain/product/api.ts - PUT /:id`);
        }
        res.status(200).json(item);
      } catch (error) {
        next(error);
      }
    }
  );

  router.delete(
    '/:id',
    logRequest({}),
    // validateRequest({ schema: idSchema, isParam: true }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await deleteById(req.params.id);
        res.status(204).json({ message: `${model} is deleted` });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};

export { routes };
