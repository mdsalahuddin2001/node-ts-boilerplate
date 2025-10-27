import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import logger from '@/libraries/log/logger';

/**
 * Middleware to handle cart session for both authenticated and guest users
 * Sets req.cartIdentifier with either userId or sessionId
 */
export const handleCartSession = (req: Request, res: Response, next: NextFunction) => {
  // Check if user is authenticated (assumes auth middleware has run)
  const userId = req.user?.id;

  if (userId) {
    // Authenticated user
    req.cartIdentifier = { userId };
    logger.debug('handleCartSession(): Authenticated user', { userId });
  } else {
    // Guest user - check for existing session or create new one
    let sessionId = req.cookies?.cartSessionId;

    if (!sessionId) {
      // Generate new session ID for guest
      sessionId = `guest_${uuidv4()}`;

      // Set cookie (expires in 30 days)
      res.cookie('cartSessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      logger.info('handleCartSession(): New guest session created', { sessionId });
    } else {
      logger.debug('handleCartSession(): Existing guest session', { sessionId });
    }

    req.cartIdentifier = { sessionId };
  }

  next();
};
