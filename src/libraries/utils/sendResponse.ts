import { Response } from 'express';

const errorResponse = (
  res: Response,
  {
    statusCode = 500,
    status = '',
    message = 'Internal Server Error',
    errors = undefined,
    comingFrom = '',
  }: {
    statusCode?: number;
    status?: string;
    message?: string;
    errors?: unknown;
    comingFrom?: string;
  }
): Response => {
  return res.status(statusCode).json({
    success: false,
    status,
    message,
    errors,
    comingFrom,
  });
};

const successResponse = (
  res: Response,
  {
    statusCode = 200,
    message = 'success',
    data = {},
  }: { statusCode?: number; message?: string; data?: unknown }
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
const paginatedSuccessResponse = (
  res: Response,
  {
    statusCode = 200,
    message = 'success',
    data = {
      items: [],
      pagination: {},
    },
  }: { statusCode?: number; message?: string; data?: { items: unknown; pagination: unknown } }
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data.items,
    pagination: data.pagination,
  });
};

export { errorResponse, successResponse, paginatedSuccessResponse };
