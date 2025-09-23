import logger from '@/libraries/log/logger';
import { errorResponse } from '@/libraries/utils/sendResponse';
import { NextFunction, Request, Response } from 'express';
import z, { ZodError, ZodType } from 'zod';

// Types for validation schemas
interface ValidationSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

// Extended Request type with validated data
interface ValidatedRequest extends Request {
  validatedData: {
    body?: unknown;
    query?: unknown;
    params?: unknown;
  };
}

// Main validation middleware
export const validateRequest = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validatedReq = req as ValidatedRequest;
    validatedReq.validatedData = {};

    try {
      // Validate request body
      if (schemas.body) {
        validatedReq.validatedData.body = schemas.body.parse(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        validatedReq.validatedData.query = schemas.query.parse(req.query);
      }

      // Validate route parameters
      if (schemas.params) {
        validatedReq.validatedData.params = schemas.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorsTree = z.treeifyError(error);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorObj = (errorsTree as any)?.properties;

        errorResponse(res, {
          message: 'Validation Failed',
          statusCode: 400,
          status: 'error',
          errors: errorObj,
          comingFrom: 'requestValidate middleware: error instanceof ZodError',
        });
      }

      // Handle async validation errors
      if (error instanceof Error) {
        logger.error('Async validation error:', error);
        errorResponse(res, {
          statusCode: 400,
          status: 'error',
          message: error.message,
          comingFrom: 'requestValidate middleware: error instanceof Error',
        });
      }

      logger.error('Validation middleware error:', error);
      errorResponse(res, {
        statusCode: 500,
        status: 'error',
        message: 'Internal server error during validation',
        comingFrom: 'requestValidate middleware: fallback',
      });
    }
  };
};

// Convenience middleware for body-only validation
export const validateBody = (schema: ZodType) => {
  return validateRequest({ body: schema });
};

// Convenience middleware for query-only validation
export const validateQuery = (schema: ZodType) => {
  return validateRequest({ query: schema });
};

// Convenience middleware for params-only validation
export const validateParams = (schema: ZodType) => {
  return validateRequest({ params: schema });
};
