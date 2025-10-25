import express, { NextFunction, Request, Response } from 'express';
import logger from '../../libraries/log/logger';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  verifyCartItems,
  mergeGuestCart,
} from './service';
import { successResponse } from '@/libraries/utils/sendResponse';
import { validateBody } from '@/middlewares/request-validate';
import { logRequest } from '../../middlewares/log';
import { handleCartSession } from '@/middlewares/cart-session';
import { addItemSchema, updateItemSchema, removeItemSchema } from './validation';
import { checkUser } from '@/middlewares/auth';

const model: string = 'Cart';

// CRUD for cart
const routes = (): express.Router => {
  const router = express.Router();
  logger.info(`Setting up routes for ${model}`);

  /* =================================================
  [GET] /api/v1/cart - Get Cart (Guest or Authenticated) - Public
  ====================================================*/
  router.get(
    '/',
    logRequest({}),
    checkUser,
    handleCartSession,
    async (req: Request, res: Response, _next: NextFunction) => {
      const data = await getCart(req.cartIdentifier!);
      successResponse(res, { data });
    }
  );

  /* =================================================
  [POST] /api/v1/cart/items - Add Item to Cart - Public
  ====================================================*/
  router.post(
    '/items',
    logRequest({}),
    checkUser,
    handleCartSession,
    validateBody(addItemSchema),
    async (req: Request, res: Response) => {
      const body = addItemSchema.parse(req.body);
      const data = await addItem(req.cartIdentifier!, body);

      successResponse(res, {
        data,
        message: 'Item added to cart successfully',
        statusCode: 201,
      });
    }
  );

  /* ================================================================
  [PATCH] /api/v1/cart/items - Update Item Quantity - Public
  ====================================================================*/
  router.patch(
    '/items',
    logRequest({}),
    handleCartSession,
    validateBody(updateItemSchema),
    async (req: Request, res: Response) => {
      const body = updateItemSchema.parse(req.body);
      const data = await updateItem(req.cartIdentifier!, body);

      successResponse(res, {
        data,
        message: 'Cart item updated successfully',
      });
    }
  );

  /* =================================================================
  [DELETE] /api/v1/cart/items - Remove Item from Cart - Public
  ====================================================================*/
  router.delete(
    '/items',
    logRequest({}),
    checkUser,
    handleCartSession,
    validateBody(removeItemSchema),
    async (req: Request, res: Response) => {
      const { product } = removeItemSchema.parse(req.body);
      const data = await removeItem(req.cartIdentifier!, product);

      successResponse(res, {
        data,
        message: 'Item removed from cart successfully',
      });
    }
  );

  /*
  [DELETE] /api/v1/cart - Clear Cart - Public
  */
  router.delete(
    '/',
    logRequest({}),
    checkUser,
    handleCartSession,
    async (req: Request, res: Response) => {
      const data = await clearCart(req.cartIdentifier!);

      successResponse(res, {
        data,
        message: 'Cart cleared successfully',
      });
    }
  );

  /*
  [POST] /api/v1/cart/verify - Verify Cart Items (Before Checkout) - Public
  */
  router.post('/verify', logRequest({}), handleCartSession, async (req: Request, res: Response) => {
    const data = await verifyCartItems(req.cartIdentifier!);

    successResponse(res, {
      data,
      message: 'Cart verified successfully',
    });
  });

  /*
  [POST] /api/v1/cart/merge - Merge Guest Cart with User Cart (After Login) - Authenticated
  */
  router.post('/merge', logRequest({}), async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      successResponse(res, {
        data: null,
        message: 'User not authenticated',
      });
      return;
    }

    const sessionId = req.cookies?.cartSessionId;

    if (!sessionId) {
      // No guest cart to merge
      const data = await getCart({ userId });
      successResponse(res, {
        data,
        message: 'No guest cart to merge',
      });
      return;
    }

    const data = await mergeGuestCart(sessionId, userId);

    // Clear the guest session cookie
    res.clearCookie('cartSessionId');

    successResponse(res, {
      data,
      message: 'Carts merged successfully',
    });
  });

  return router;
};

export { routes };
