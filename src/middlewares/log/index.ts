import { Request, Response, NextFunction } from 'express';
import logger from '../../libraries/log/logger';

interface LogRequestOptions {
  fields?: string[];
}

// Middleware to log the request
const logRequest = ({ fields = [] }: LogRequestOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const logData: Record<string, unknown> = {};

    if (req.params) {
      logData.params = req.params;
    }
    if (req.query) {
      logData.query = req.query;
    }
    if (req.body) {
      if (fields && fields.length > 0) {
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

    logger.info(`${req.method} ${req.originalUrl}`, logData);

    // Store the original end method
    const oldEnd = res.end;
    // Override the end method
    res.end = function (...args: unknown[]): Response<unknown, Record<string, unknown>> {
      logger.info(`${req.method} ${req.originalUrl}`, {
        statusCode: res.statusCode,
      });
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      return oldEnd.apply(this, args);
    };

    next();
  };
};

export { logRequest };
