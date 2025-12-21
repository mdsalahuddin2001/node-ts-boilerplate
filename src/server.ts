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
import logger from '@/libraries/log/logger';
import defineRoutes from '@/routes';
import configs from '@/configs';
import { errorResponse } from '@/libraries/utils/sendResponse';
import '@/auth/strategies';
import { addRequestIdMiddleware, retrieveRequestId } from '@/middlewares/request-context';
import '@/libraries/bullmq';
import { startCronJobs } from './crons/runners/scheduler';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

console.log('ConfigsConfigsConfigs', {
  MONGO_URL: configs.MONGODB_URI,
  REDIS_URL: configs.REDIS_HOST,
  REDIS_PASSWORD: configs.REDIS_PASSWORD,
});
const SERVER_PORT = configs.PORT || 4000;

let io: Server;

const start = (app: Application): void => {
  securityMiddleware(app);
  standardMiddleware(app);
  routesMiddleware(app);

  //   startQueues();
  //   startElasticSearch();
  errorHandler(app);

  startCronJobs();
  startServer(app);
};
/* ------ Security Middlewares ----- */
const securityMiddleware = (app: Application): void => {
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(hpp());
  // @TODO: need to remove content security: false option before moving to production
  app.use(helmet({ contentSecurityPolicy: false }));
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
const startServer = async (app: Application): Promise<void> => {
  try {
    const httpServer: http.Server = new http.Server(app);
    const socketIO: Server = await createSocketIO(httpServer);
    startHttpServer(httpServer);
    io = socketIO;
  } catch (error) {
    logger.log('error', 'startServer() method error:', error);
    // eslint-disable-next-line no-console
    console.error('startServer() method error:', error);
  }
};

/* -------- Create Socket IO ----------- */
const createSocketIO = async (httpServer: http.Server): Promise<Server> => {
  try {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      },
    });
    // Create Redis clients for pub/sub
    const pubClient = createClient({
      url: `redis://:${configs.REDIS_PASSWORD}@${configs.REDIS_HOST}:${configs.REDIS_PORT}`,
      // url: `redis://:${configs.REDIS_PASSWORD}@localhost:6379`,
      socket: {
        reconnectStrategy: retries => {
          if (retries > 10) {
            logger.error('Redis pub client: Too many reconnection attempts');
            return new Error('Too many reconnection attempts');
          }
          return Math.min(retries * 100, 3000);
        },
      },
    });

    const subClient = pubClient.duplicate();

    // Handle Redis connection events
    pubClient.on('error', err => logger.error('Redis Pub Client Error:', err));
    subClient.on('error', err => logger.error('Redis Sub Client Error:', err));

    pubClient.on('connect', () => logger.info('Redis Pub Client connected'));
    subClient.on('connect', () => logger.info('Redis Sub Client connected'));

    // Connect Redis clients
    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Attach Redis adapter to Socket.IO
    io.adapter(createAdapter(pubClient, subClient));

    logger.info('Socket.IO Redis adapter configured successfully');

    // Socket.IO connection handling
    io.on('connection', socket => {
      logger.info(`New socket connection: ${socket.id}`);

      // Example: Join a room
      socket.on('join:room', (roomId: string) => {
        socket.join(roomId);
        logger.info(`Socket ${socket.id} joined room: ${roomId}`);
        socket.emit('joined:room', { roomId, message: 'Successfully joined room' });
      });

      // Example: Leave a room
      socket.on('leave:room', (roomId: string) => {
        socket.leave(roomId);
        logger.info(`Socket ${socket.id} left room: ${roomId}`);
        socket.emit('left:room', { roomId, message: 'Successfully left room' });
      });

      // Example: Send message to a room
      socket.on('send:message', (data: { roomId: string; message: string }) => {
        io.to(data.roomId).emit('receive:message', {
          senderId: socket.id,
          message: data.message,
          timestamp: new Date(),
        });
        logger.info(`Message sent to room ${data.roomId} by ${socket.id}`);
      });

      // Handle disconnection
      socket.on('disconnect', reason => {
        logger.info(`Socket ${socket.id} disconnected: ${reason}`);
      });

      // Handle errors
      socket.on('error', error => {
        logger.error(`Socket ${socket.id} error:`, error);
      });

      playWithSocket(socket, io);
    });

    // Graceful shutdown handler
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, closing Socket.IO and Redis connections');
      io.close();
      await pubClient.quit();
      await subClient.quit();
    });
    return io;
  } catch (error) {
    logger.error('Failed to setup Socket.IO with Redis adapter:', error);
    throw error;
  }
};

const startHttpServer = (httpServer: http.Server): void => {
  try {
    logger.info(`Server has started with process id ${process.pid}`);
    // eslint-disable-next-line no-console
    console.log(`Server has started with process id ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      logger.info(`Server running on port ${SERVER_PORT}`);
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    logger.log('error', 'Server startHttpServer() method error:', error);
    // eslint-disable-next-line no-console
    console.error('Server startHttpServer() method error:', error);
  }
};

export { start, io };

// @TODO: Remove after practicing socket.io
function playWithSocket(socket: Socket, io: Server): void {
  socket.on('request', (arg1, arg2, callback) => {
    console.log(arg1); // { foo: 'bar' }
    console.log(arg2); // 'baz'
    callback({
      status: 'ok',
    });
  });
  socket.on('chat message', (msg: string) => {
    console.log('message: %s', msg);
    io.emit('new:message', msg);
  });
  socket.on('order.created', (msg: string) => {
    console.log('message: %s', msg);
  });
}
