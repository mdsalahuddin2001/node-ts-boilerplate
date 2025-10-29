import express, { Request, Response, NextFunction } from 'express';
import logger from '../../libraries/log/logger';
import { create, search, getById, updateById, deleteById, getTree } from './service';

// import { createSchema, updateSchema, idSchema } from './request';
// import { validateRequest } from '../../middlewares/request-validate';
import { logRequest } from '@/middlewares/log';
import { NotFoundError } from '@/libraries/error-handling';
import { paginatedSuccessResponse, successResponse } from '@/libraries/utils/sendResponse';
import { validateBody, validateParams } from '@/middlewares/request-validate';
import { createSchema, deleteSchema } from './validation';

const model: string = 'Category';

// CRUD for entity
const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  /* =======================================
  [GET] /api/v1/categories
  Get All categories
  Access: Public
  ======================================= */
  router.get('/', logRequest({}), async (req: Request, res: Response, _next: NextFunction) => {
    const data = await search(req.query);
    paginatedSuccessResponse(res, { data });
  });

  /*
  [GET] /api/v1/categories/tree - Get All categories as tree structure - Public|Private|Admin
  */
  router.get('/tree', logRequest({}), async (_req: Request, res: Response, _next: NextFunction) => {
    const data = await getTree();
    successResponse(res, { data });
  });

  /*
  [POST] /api/v1/categories - Create a new category - Public|Private|Admin
  */
  router.post(
    '/',
    logRequest({}),
    validateBody(createSchema),
    async (req: Request, res: Response) => {
      const data = await create(req.body);
      successResponse(res, { data });
    }
  );

  /*
  [GET] /api/v1/categories/:id - Get category by ID - Public|Private|Admin
  */
  router.get(
    '/:id',
    logRequest({}),
    // validateRequest({ schema: idSchema, isParam: true }),
    async (req: Request, res: Response, _next: NextFunction) => {
      const item = await getById(req.params.id);
      if (!item) {
        throw new NotFoundError(`${model} not found`, `domain/product/api.ts - /:id`);
      }
      successResponse(res, { data: item });
    }
  );

  /*
  [PUT] /api/v1/categories/:id - Update category by ID - Public|Private|Admin
  */
  router.patch(
    '/:id',
    logRequest({}),
    // validateRequest({ schema: idSchema, isParam: true }),
    // validateRequest({ schema: updateSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const item = await updateById(req.params.id, req.body);
        if (!item) {
          throw new NotFoundError(`${model} not found`, `domain/product/api.ts - PATCH /:id`);
        }
        successResponse(res, { data: item });
      } catch (error) {
        next(error);
      }
    }
  );

  /*
  [DELETE] /api/v1/categories/:id - Delete category by ID - Public|Private|Admin
  */
  router.delete(
    '/:id',
    logRequest({}),
    validateParams(deleteSchema),
    async (req: Request, res: Response) => {
      const deletedItem = await deleteById(req.params.id);
      successResponse(res, { data: deletedItem });
    }
  );

  return router;
};

export { routes };
