// import { retrieveRequestId } from '../../middlewares/request-context';
// import { createLogger, format, Logger, transports } from 'winston';
// import 'winston-daily-rotate-file';

// const LOG_DIR = 'logs';

// class LogManager {
//   private static instance: LogManager | undefined;
//   private logger;

//   private constructor() {
//     this.logger = createLogger({
//       level: 'info',
//       format: format.combine(
//         format.timestamp({
//           format: 'YYYY-MM-DD HH:mm:ss',
//         }),
//         format.errors({ stack: true }),
//         format.splat(),
//         format.json(),
//         format(info => {
//           const requestId = retrieveRequestId();
//           if (requestId) {
//             info.requestId = requestId;
//           }
//           return info;
//         })()
//       ),
//       transports: [
//         new transports.File({
//           filename: `${LOG_DIR}/error.log`,
//           level: 'error',
//         }),
//         new transports.File({ filename: `${LOG_DIR}/combined.log` }),
//         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//         //@ts-ignore
//         new transports.DailyRotateFile({
//           filename: `${LOG_DIR}/application-%DATE%.log`,
//           datePattern: 'YYYY-MM-DD-HH',
//           zippedArchive: true,
//           maxSize: '20m',
//           maxFiles: '14d',
//         }),
//       ],
//     });

//     if (process.env.NODE_ENV !== 'production') {
//       this.logger.add(
//         new transports.Console({
//           format: format.combine(format.colorize(), format.simple()),
//         })
//       );
//     }
//   }

//   public getLogger(): Logger {
//     return this.logger;
//   }

//   public static getInstance(): LogManager {
//     if (!this.instance) {
//       this.instance = new LogManager();
//     }

//     return this.instance;
//   }
// }

// export default LogManager.getInstance().getLogger();

import { retrieveRequestId } from '../../middlewares/request-context';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const LOG_DIR = 'logs';

class LogManager {
  private static instance: LogManager | undefined;
  private logger;

  private constructor() {
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
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
        //@ts-ignore
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

  private addRequestId(meta: any): object {
    const requestId = retrieveRequestId();

    // Handle different types of meta
    let safeMeta: any = {};

    if (meta !== null && meta !== undefined) {
      if (typeof meta === 'object') {
        safeMeta = { ...meta };
      } else {
        safeMeta = { value: String(meta) };
      }
    }

    // Handle error objects specially
    if (meta instanceof Error) {
      safeMeta = {
        error: meta.message,
        stack: meta.stack,
        name: meta.name,
      };
    } else if (safeMeta.error instanceof Error) {
      safeMeta.error = {
        message: safeMeta.error.message,
        stack: safeMeta.error.stack,
        name: safeMeta.error.name,
      };
    } else if (safeMeta.error && typeof safeMeta.error !== 'object') {
      safeMeta.error = String(safeMeta.error);
    }

    if (requestId) {
      safeMeta.requestId = requestId;
    }

    return safeMeta;
  }

  public log(level: string, message: string, meta?: any): void {
    this.logger.log(level, message, this.addRequestId(meta));
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, this.addRequestId(meta));
  }

  public error(message: string, meta?: any): void {
    this.logger.error(message, this.addRequestId(meta));
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, this.addRequestId(meta));
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, this.addRequestId(meta));
  }

  public http(message: string, meta?: any): void {
    this.logger.http(message, this.addRequestId(meta));
  }

  public verbose(message: string, meta?: any): void {
    this.logger.verbose(message, this.addRequestId(meta));
  }

  public silly(message: string, meta?: any): void {
    this.logger.silly(message, this.addRequestId(meta));
  }

  public static getInstance(): LogManager {
    if (!this.instance) {
      this.instance = new LogManager();
    }

    return this.instance;
  }
}

export default LogManager.getInstance();
