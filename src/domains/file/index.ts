import { Router } from 'express';
import { routes } from './api';

const defineRoutes = (expressRouter: Router): void => {
  expressRouter.use('/uploads', routes());
};

export default defineRoutes;
