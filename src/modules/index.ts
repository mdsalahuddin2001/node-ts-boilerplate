import { Router } from 'express';
import authRoutes from '@/auth';
import categoryRoutes from './category';
import productRoutes from './product';
import cartRoutes from './cart';
import orderRoutes from './order';
import fileRoutes from './file';
import userRoutes from './user';

const defineRoutes = async (expressRouter: Router): Promise<void> => {
  authRoutes(expressRouter);
  userRoutes(expressRouter);
  categoryRoutes(expressRouter);
  productRoutes(expressRouter);
  cartRoutes(expressRouter);
  orderRoutes(expressRouter);
  fileRoutes(expressRouter);
};

export default defineRoutes;
