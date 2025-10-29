import http from 'http';
import qs from 'qs';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import { Application, NextFunction, Request, Response, json, urlencoded } from 'express';
import cookieParser from 'cookie-parser';
import { AppError, IErrorResponse } from './libraries/error-handling';
// import { Channel } from 'amqplib';
import logger from './libraries/log/logger';
import defineRoutes from './routes';
import configs from './configs';
import { errorResponse } from './libraries/utils/sendResponse';
import '@/auth/strategies';
import { addRequestIdMiddleware, retrieveRequestId } from './middlewares/request-context';

const SERVER_PORT = configs.PORT || 4000;

const start = (app: Application): void => {
  securityMiddleware(app);
  standardMiddleware(app);
  routesMiddleware(app);

  //   startQueues();
  //   startElasticSearch();
  errorHandler(app);
  startServer(app);
};
/* ------ Security Middlewares ----- */
const securityMiddleware = (app: Application): void => {
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(hpp());
  app.use(helmet());
  const allowed_origins = ['http://localhost:3000'];
  app.use(
    cors({
      origin: function (origin, callback) {
        // Allow requests with no origin (like Postman, mobile apps, etc.)
        if (!origin) return callback(null, true);

        if (allowed_origins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    })
  );

  //   app.use((req: Request, _res: Response, next: NextFunction) => {
  //     if (req.headers.authorization) {
  //       const token = req.headers.authorization.split(' ')[1];
  //       const payload: IAuthPayload = verify(token, config.JWT_TOKEN!) as IAuthPayload;
  //       req.currentUser = payload;
  //     }
  //     next();
  //   });
};
/* ------ Standard Middlewares ----- */
const standardMiddleware = (app: Application): void => {
  app.use(addRequestIdMiddleware);
  app.set('query parser', (str: string) => qs.parse(str));
  app.use(
    compression({
      filter: (_req, res) => {
        return !!/json|text|javascript|css/.test(res.getHeader('Content-Type') as string);
      },
      brotli: {},
    })
  );
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
};
/* ------ Routes Middlewares ----- */
const routesMiddleware = (app: Application): void => {
  defineRoutes(app);
};

// const startQueues = async (): Promise<void> => {
//   const userChannel: Channel = (await createConnection()) as Channel;
//   await consumeBuyerDirectMessage(userChannel);
//   await consumeSellerDirectMessage(userChannel);
//   await consumeReviewFanoutMessages(userChannel);
//   await consumeSeedGigDirectMessages(userChannel);
// };
// const startElasticSearch = (): void => {
//   checkConnection();
// };
/* ------ Error Handler ----- */

const errorHandler = (app: Application): void => {
  app.use(
    (
      error: IErrorResponse & {
        name?: string;
        code?: number;
        errors?: Record<string, any>;
        keyValue?: Record<string, any>;
        path?: string;
        value?: any;
        comingFrom?: string;
        stack?: string;
      },
      req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      const requestId = retrieveRequestId();

      // Create a structured log entry for easier tracing and debugging
      const logMeta = {
        requestId,
        method: req.method,
        path: req.originalUrl,
        service: 'api-service',
        environment: process.env.NODE_ENV,
        error_name: error.name,
        error_message: error.message,
        statusCode: error.statusCode || 500,
        ...(process.env.NODE_ENV !== 'production' && error.stack && { stack: error.stack }),
      };

      logger.error(`Error Handler${error.comingFrom ? error.comingFrom : ''}`, logMeta);

      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors || {}).map((err: any) => err.message);
        return errorResponse(res, {
          statusCode: 400,
          status: 'fail',
          message: 'Validation Error',
          errors: messages,
        });
      }

      // Handle invalid ObjectId or cast errors
      if (error.name === 'CastError') {
        return errorResponse(res, {
          statusCode: 400,
          status: 'fail',
          message: `Invalid ${error.path}: ${error.value}`,
        });
      }

      // Handle duplicate key errors (MongoDB)
      if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0];
        return errorResponse(res, {
          statusCode: 409,
          status: 'fail',
          message: `Duplicate value for field: ${field}`,
        });
      }

      // Handle custom application-level errors
      if (error instanceof AppError) {
        return errorResponse(res, error.serializeErrors());
      }

      // Fallback for unknown or unhandled errors
      return errorResponse(res, {
        statusCode: error.statusCode || 500,
        status: error.status || 'error',
        message: error.message || 'Internal Server Error',
      });
    }
  );
};

export default errorHandler;

/* ------ Start Server ----- */
const startServer = (app: Application): void => {
  try {
    const httpServer: http.Server = new http.Server(app);
    logger.info(`Server has started with process id ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      logger.info(`Server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    logger.log('error', 'startServer() method error:', error);
  }
};

export { start };
