import { Router } from 'express';
import { routes } from './api';

const defineRoutes = (expressRouter: Router): void => {
  expressRouter.use('/users', routes());
};

export default defineRoutes;
