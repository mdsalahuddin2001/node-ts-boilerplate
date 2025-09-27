import { Response } from 'express';
export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  startIndex: number;
  endIndex: number;
}
export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationInfo;
}

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
  }: { statusCode?: number; message?: string; data?: PaginatedData<any> | any }
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data.items,
    pagination: data.pagination,
  });
};

export { errorResponse, successResponse, paginatedSuccessResponse };
