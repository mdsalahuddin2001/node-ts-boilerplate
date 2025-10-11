import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '@/libraries/error-handling';
import { verifyAccessToken } from '@/libraries/utils/tokens';
import logger from '@/libraries/log/logger';

// Extend Express Request type to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name?: string;
      role: 'user' | 'admin' | 'vendor';
      iat?: number;
      exp?: number;
    };
  }
}
/**
 * Middleware to authenticate users using JWT token
 * Extracts token from Authorization header or cookies
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header or cookies
    let token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      token = req.cookies?.access_token;
    }

    if (!token) {
      throw new UnauthorizedError('You are not authenticated', 'authenticate middleware');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Attach user to request
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };

    next();
  } catch (error) {
    logger.error('Authentication failed', error);
    next(new UnauthorizedError('Invalid or expired token', 'authenticate middleware'));
  }
};

/**
 * Middleware to authorize users based on roles
 * @param roles - Array of allowed roles
 */
export const authorize = (...roles: Array<'user' | 'admin' | 'vendor'>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required', 'authorize middleware'));
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `User ${req.user.id} with role ${req.user.role} attempted to access resource requiring roles: ${roles.join(', ')}`
      );
      return next(
        new ForbiddenError(
          'You do not have permission to access this resource',
          'authorize middleware'
        )
      );
    }

    next();
  };
};

/**
 * Optional authentication - attaches user if token exists but doesn't fail if missing
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      token = req.cookies?.access_token;
    }

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      };
    }
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed', error);
  }

  next();
};

/**
 * Check if user owns the resource or is admin
 * @param getUserId - Function to extract user ID from request params/body
 */
export const isOwnerOrAdmin = (getUserId: (req: Request) => string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required', 'isOwnerOrAdmin middleware'));
    }

    const resourceUserId = getUserId(req);

    if (req.user.role === 'admin' || req.user.id === resourceUserId) {
      return next();
    }

    return next(
      new ForbiddenError(
        'You do not have permission to access this resource',
        'isOwnerOrAdmin middleware'
      )
    );
  };
};
