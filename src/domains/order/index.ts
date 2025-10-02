import { Router } from 'express';
import { routes } from './api';

const defineRoutes = (expressRouter: Router): void => {
  expressRouter.use('/orders', routes());
};

export default defineRoutes;
