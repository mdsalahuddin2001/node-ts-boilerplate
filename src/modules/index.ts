import authRoutes from '@/auth';
import categoryRoutes from './category';
import productRoutes from './product';
import orderRoutes from './order';
import fileRoutes from './file';
import { Router } from 'express';

const defineRoutes = async (expressRouter: Router): Promise<void> => {
  authRoutes(expressRouter);
  categoryRoutes(expressRouter);
  productRoutes(expressRouter);
  orderRoutes(expressRouter);
  fileRoutes(expressRouter);
};

export default defineRoutes;
