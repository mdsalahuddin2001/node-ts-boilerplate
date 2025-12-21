import express, { Application, Request, Response } from 'express';
import logger from './libraries/log/logger';
import domainRoutes from './modules/index';

function defineRoutes(expressApp: Application): void {
  logger.info('Defining routes...');
  const router = express.Router();

  domainRoutes(router);
  expressApp.use('/api/v1', router);

  // Health check
  expressApp.get('/health', (_req: Request, res: Response) => {
    res.send('OK');
  });

  expressApp.get('/html', (_req: Request, res: Response) => {
    res.sendFile('index.html', { root: __dirname });
  });

  // 404 handler
  expressApp.use((_req: Request, res: Response) => {
    res.status(404).send('Not Found');
  });

  logger.info('Routes defined');
}

export default defineRoutes;
