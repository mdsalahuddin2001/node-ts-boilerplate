import express, { NextFunction, Request, Response } from 'express';
import logger from '../../libraries/log/logger';
import { create, getById, getCurrent, search, updateUserById } from './service';

import { BadRequestError, NotFoundError } from '@/libraries/error-handling';
import { paginatedSuccessResponse, successResponse } from '@/libraries/utils/sendResponse';
import { authenticate, authorize } from '@/middlewares/auth';
import { validateBody } from '@/middlewares/request-validate';
import { logRequest } from '../../middlewares/log';
import {
  changePasswordSchema,
  createUserSchema,
  updateMeSchema,
  updateUserSchema,
} from './validation';

const model: string = 'Product';

const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  /* =================================================
  GET - /api/v1/users - Search users - Admin
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
  POST - /api/v1/users - Create user - Admin
  ====================================================*/
  router.post(
    '/',
    authenticate,
    authorize('admin'),
    validateBody(createUserSchema),
    logRequest({}),
    async (req: Request, res: Response) => {
      const { name, email, password, role = 'user' } = req.body;
      if (!name || !email || !password) {
        throw new BadRequestError(
          'Please provide name, email, password, and role',
          `module/user/api.ts - /`
        );
      }
      const item = await create({ name, email, password, role });
      successResponse(res, { data: item });
    }
  );

  /* =================================================
  GET - /api/v1/users/me - Get current user - User
  ====================================================*/
  router.get('/me', authenticate, logRequest({}), async (req: Request, res: Response) => {
    const user = await getCurrent(req?.user?.id || '');
    if (!user) {
      throw new NotFoundError(`${model} not found`, `domain/user/api.ts - /me`);
    }
    successResponse(res, { data: user });
  });

  /* =================================================
  GET - /api/v1/users/:id - Get user by id - User
  ====================================================*/
  router.get('/:id', authenticate, logRequest({}), async (req: Request, res: Response) => {
    const user = await getById(req?.params?.id || '');
    if (!user) {
      throw new NotFoundError(`${model} not found`, `domain/user/api.ts - /:id`);
    }
    successResponse(res, { data: user });
  });

  /* =================================================
  PATCH - /api/v1/users/me - Update current user - User
  ====================================================*/
  router.patch(
    '/me',
    authenticate,
    validateBody(updateMeSchema),
    logRequest({}),
    async (req: Request, res: Response) => {
      const { name } = req.body;
      if (!name) {
        throw new BadRequestError(
          'Please provide at least one field to update',
          `module/user/api.ts - /me`
        );
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

  /* =================================================
  PATCH - /api/v1/users/me/change-password - Update current user password
  ====================================================*/
  router.patch(
    '/me/change-password',
    authenticate,
    validateBody(changePasswordSchema),
    logRequest({}),
    async (req: Request, res: Response) => {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        throw new BadRequestError(
          'Please provide oldPassword and newPassword',
          `module/user/api.ts - /me/change-password`
        );
      }
      const user = await getById(req?.user?.id || '');
      if (!user) {
        throw new NotFoundError(`${model} not found`, `module/user/api.ts - /me/change-password`);
      }

      const isPasswordMatch = await user.comparePassword(oldPassword);
      if (!isPasswordMatch) {
        throw new BadRequestError(
          'Old password does not match',
          `module/user/api.ts - /me/change-password`
        );
      }
      const item = await updateUserById(req?.user?.id || '', { password: newPassword });
      if (!item) {
        throw new NotFoundError(`${model} not found`, `module/user/api.ts - /me/change-password`);
      }
      successResponse(res, { data: item });
    }
  );

  /* =================================================
  GET - /api/v1/users/:id - Get user by id - Admin
  ====================================================*/
  router.get(
    '/:id',
    authenticate,
    authorize('admin'),
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

  /* =================================================
  PATCH - /api/v1/users/:id - Update user by id - Admin
  ====================================================*/
  router.patch(
    '/:id',
    logRequest({}),
    authenticate,
    authorize('admin'),
    validateBody(updateUserSchema),
    async (req: Request, res: Response) => {
      const { name, email } = req.body;
      if (!name && !email) {
        throw new BadRequestError('Invalid request body', `module/user/api.ts - /:id`);
      }
      const user = await getById(req?.params?.id || '');
      if (!user) {
        throw new NotFoundError(`${model} not found`, `module/user/api.ts - /:id`);
      }
      const item = await updateUserById(req?.params?.id || '', { name, email });
      if (!item) {
        throw new NotFoundError(`${model} not found`, `module/user/api.ts - /:id`);
      }
      successResponse(res, { data: item });
    }
  );

  /* =================================================
  DELETE - /api/v1/users/:id - Delete user by id - Admin
  ====================================================*/
  router.delete(
    '/:id',
    logRequest({}),
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
