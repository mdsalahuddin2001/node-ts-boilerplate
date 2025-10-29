// src/middlewares/log-request.ts
import { Request, Response, NextFunction } from 'express';
import logger from '@/libraries/log/logger';

interface LogRequestOptions {
  fields?: string[];
}

export const logRequest = ({ fields = [] }: LogRequestOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    const baseInfo = {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    };

    const logData: Record<string, unknown> = { ...baseInfo };

    // Log selective or full body
    if (req.body) {
      if (fields.length > 0) {
        fields.forEach(field => {
          // eslint-disable-next-line security/detect-object-injection
          if (req.body[field] !== undefined) {
            // eslint-disable-next-line security/detect-object-injection
            logData[field] = req.body[field];
          }
        });
      } else {
        logData.body = req.body;
      }
    }

    if (req.query && Object.keys(req.query).length > 0) {
      logData.query = req.query;
    }
    if (req.params && Object.keys(req.params).length > 0) {
      logData.params = req.params;
    }

    // Log request start
    logger.info('Incoming request', logData);

    // Listen for response end
    res.on('finish', () => {
      const duration = Date.now() - startTime;

      logger.info('Request completed', {
        ...baseInfo,
        statusCode: res.statusCode,
        duration,
      });
    });

    next();
  };
};
