// src/middlewares/request-context.ts
import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

const requestContextStore = new AsyncLocalStorage<Map<string, any>>();
const REQUEST_ID_HEADER_NAME = 'x-request-id';

const generateRequestId = (): string => randomUUID();

export const addRequestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const existingRequestId = req.get(REQUEST_ID_HEADER_NAME) as string | undefined;
  const requestId = existingRequestId || generateRequestId();

  res.setHeader(REQUEST_ID_HEADER_NAME, requestId);

  // Store context for this request
  requestContextStore.run(new Map(), () => {
    const store = requestContextStore.getStore();
    if (store) {
      store.set('requestId', requestId);
      if ((req as any).user?.id) store.set('userId', (req as any).user.id);
    }
    next();
  });
};

export const retrieveRequestId = (): string | undefined =>
  requestContextStore.getStore()?.get('requestId');

export const retrieveUserId = (): string | undefined =>
  requestContextStore.getStore()?.get('userId');
