import { Router } from 'express';
import { routes } from './api';

const defineRoutes = (expressRouter: Router): void => {
  expressRouter.use('/categories', routes());
};

export default defineRoutes;
