import express, { Request, Response, NextFunction } from 'express';
import logger from '../../libraries/log/logger';
import { create, search, getById, updateById, deleteById } from './service';

// import { createSchema, updateSchema, idSchema } from './request';
// import { validateRequest } from '../../middlewares/request-validate';
import { logRequest } from '../../middlewares/log';
import { NotFoundError } from '@/libraries/error-handling';

const model: string = 'Product';

// CRUD for entity
const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  router.get('/', logRequest({}), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const items = await search(req.query);
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  router.post(
    '/',
    logRequest({}),
    // validateRequest({ schema: createSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const item = await create(req.body);
        res.status(201).json(item);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get(
    '/:id',
    logRequest({}),
    // validateRequest({ schema: idSchema, isParam: true }),
    async (req: Request, res: Response, _next: NextFunction) => {
      const item = await getById(req.params.id);
      if (!item) {
        throw new NotFoundError(`${model} not found`, `domain/product/api.ts - /:id`);
      }
      res.status(200).json(item);
    }
  );

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
