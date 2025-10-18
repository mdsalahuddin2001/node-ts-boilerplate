import express, { NextFunction, Request, Response } from 'express';
import logger from '../../libraries/log/logger';
import { getById, getCurrent, search, updateUserById } from './service';

import { BadRequestError, NotFoundError } from '@/libraries/error-handling';
import { paginatedSuccessResponse, successResponse } from '@/libraries/utils/sendResponse';
import { authenticate, authorize } from '@/middlewares/auth';
import { logRequest } from '../../middlewares/log';

const model: string = 'Product';

// CRUD for entity
const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  /*
  [GET] /api/v1/users - Search users - Admin
  */
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
  /*
  [GET] /api/v1/users/me - Get current user - User
  */
  router.get('/me', authenticate, logRequest({}), async (req: Request, res: Response) => {
    const user = await getCurrent(req?.user?.id || '');
    if (!user) {
      throw new NotFoundError(`${model} not found`, `domain/user/api.ts - /me`);
    }
    successResponse(res, { data: user });
  });

  /*
  [GET] /api/v1/users/:id - Get user by id - User
  */
  router.get('/:id', authenticate, logRequest({}), async (req: Request, res: Response) => {
    const user = await getById(req?.params?.id || '');
    if (!user) {
      throw new NotFoundError(`${model} not found`, `domain/user/api.ts - /:id`);
    }
    successResponse(res, { data: user });
  });

  /*
  [PATCH] /api/v1/users/me - Update current user - User
  */
  router.patch(
    '/me',
    authenticate,
    logRequest({}),
    // validateRequest({ schema: updateSchema }),
    async (req: Request, res: Response) => {
      const { name } = req.body;
      if (!name) {
        throw new BadRequestError('Invalid request body', `module/user/api.ts - /me`);
      }
      const user = await getById(req?.user?.id || '');
      if (!user) {
        throw new NotFoundError(`${model} not found`, `module/user/api.ts - /me`);
      }
      const item = await updateUserById(req?.user?.id || '', { name });
      if (!item) {
        throw new NotFoundError(`${model} not found`, `module/user/api.ts - /me`);
      }
      successResponse(res, { data: item });
    }
  );

  router.get(
    '/:id',
    logRequest({}),
    // validateRequest({ schema: idSchema, isParam: true }),
    async (_req: Request, res: Response, _next: NextFunction) => {
      const item = null;
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
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        const item = null;
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
    async (_req: Request, res: Response, next: NextFunction) => {
      try {
        // await deleteById(req.params.id);
        res.status(204).json({ message: `${model} is deleted` });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};

export { routes };
