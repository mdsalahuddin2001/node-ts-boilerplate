import authRoutes from '@/auth';
import productRoutes from './product';
import fileRoutes from './file';
import { Router } from 'express';

const defineRoutes = async (expressRouter: Router): Promise<void> => {
  authRoutes(expressRouter);
  productRoutes(expressRouter);
  fileRoutes(expressRouter);
};

export default defineRoutes;
