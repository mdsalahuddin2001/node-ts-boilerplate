// src/libraries/log/logger.ts
import { retrieveRequestId, retrieveUserId } from '@/middlewares/request-context';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const LOG_DIR = 'logs';

class LogManager {
  private static instance: LogManager;
  private logger;

  private constructor() {
    this.logger = createLogger({
      level: 'info',
      defaultMeta: {
        service: 'api-service',
        environment: process.env.NODE_ENV || 'development',
      },
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      transports: [
        new transports.File({
          filename: `${LOG_DIR}/error.log`,
          level: 'error',
        }),
        new transports.File({ filename: `${LOG_DIR}/combined.log` }),
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        new transports.DailyRotateFile({
          filename: `${LOG_DIR}/application-%DATE%.log`,
          datePattern: 'YYYY-MM-DD-HH',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });

    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(
        new transports.Console({
          format: format.combine(format.colorize(), format.simple()),
        })
      );
    }
  }

  /** Attach request and user context automatically */
  private enrichMeta(meta?: any): Record<string, unknown> {
    const requestId = retrieveRequestId();
    const userId = retrieveUserId();
    const safeMeta: Record<string, unknown> = {};

    if (meta) {
      if (meta instanceof Error) {
        safeMeta.error_name = meta.name;
        safeMeta.error_message = meta.message;
        safeMeta.error_stack = meta.stack;
        // optional
        if ((meta as any).code) safeMeta.error_code = (meta as any).code;
        if ((meta as any).status) safeMeta.error_status = (meta as any).status;
      } else if (typeof meta === 'object') {
        Object.assign(safeMeta, meta);
      } else {
        safeMeta.value = String(meta);
      }
    }

    if (requestId) safeMeta.requestId = requestId;
    if (userId) safeMeta.userId = userId;

    return safeMeta;
  }

  public log(level: string, message: string, meta?: any): void {
    this.logger.log(level, message, this.enrichMeta(meta));
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, this.enrichMeta(meta));
  }

  public error(message: string, meta?: any): void {
    this.logger.error(message, this.enrichMeta(meta));
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, this.enrichMeta(meta));
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, this.enrichMeta(meta));
  }

  public http(message: string, meta?: any): void {
    this.logger.http(message, this.enrichMeta(meta));
  }

  public verbose(message: string, meta?: any): void {
    this.logger.verbose(message, this.enrichMeta(meta));
  }

  public silly(message: string, meta?: any): void {
    this.logger.silly(message, this.enrichMeta(meta));
  }

  public static getInstance(): LogManager {
    if (!this.instance) {
      this.instance = new LogManager();
    }
    return this.instance;
  }
}

export default LogManager.getInstance();
