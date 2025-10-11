import express, { NextFunction, Request, Response } from 'express';

import { create } from '@/modules/user/service';
import { createUserSchema } from '@/modules/user/validation';
import logger from '@/libraries/log/logger';
import { successResponse } from '@/libraries/utils/sendResponse';
import { validateBody } from '@/middlewares/request-validate';
import { loginSchema } from './validation';
import passport from 'passport';
import { loginUser, refresh } from './service';
import { clearAuthCookies, setAuthCookies } from '@/libraries/utils/cookies';
import { IUser } from '@/modules/user/schema';
import { BadRequestError } from '@/libraries/error-handling';

const model: string = 'User';

// CRUD for entity
const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for model: ${model}`);

  /**
   * @route POST /auth/register
   * @description Register a new user
   * @access Public
   */
  router.post('/register', validateBody(createUserSchema), async (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    const item = await create({ email, password, name, role: 'user' });
    successResponse(res, { data: item, message: 'User registered successfully' });
  });

  /**
   * @route POST /auth/login
   * @description Login user
   * @access Public
   */
  router.post(
    '/login',
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate(
        'local',
        { session: false },
        async (err: Error, user: IUser, info: { message: string }) => {
          if (err) return next(err);
          if (!user) return res.status(401).json({ message: info?.message });
          const { accessToken, refreshToken } = await loginUser({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          });
          setAuthCookies(res, { accessToken, refreshToken });
          successResponse(res, {
            data: { accessToken, refreshToken, user },
            message: 'User logged in successfully',
          });
        }
      )(req, res, next);
    }
  );
  /**
   * @route POST /auth/logout
   * @description Logout user
   * @access Private
   */
  router.post('/logout', (_req: Request, res: Response) => {
    clearAuthCookies(res);
    successResponse(res, { message: 'User logged out successfully' });
  });

  /**
   * @route POST /auth/refresh
   * @description Refresh tokens
   * @access Private
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    const refresh_token = req.cookies?.refresh_token;
    if (!refresh_token)
      throw new BadRequestError('Refresh token is required', 'auth POST /refresh');
    const { accessToken, refreshToken } = refresh(refresh_token);
    setAuthCookies(res, { accessToken, refreshToken });
    successResponse(res, {
      data: { accessToken, refreshToken },
      message: 'Tokens refreshed successfully',
    });
  });

  return router;
};

export { routes };
