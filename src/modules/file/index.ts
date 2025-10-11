import { Router } from 'express';
import { routes } from './api';

const defineRoutes = (expressRouter: Router): void => {
  expressRouter.use('/files', routes());
};

export default defineRoutes;
