import authRoutes from '@/auth';
import productRoutes from './product';
import { Router } from 'express';

const defineRoutes = async (expressRouter: Router): Promise<void> => {
  authRoutes(expressRouter);
  productRoutes(expressRouter);
};

export default defineRoutes;
