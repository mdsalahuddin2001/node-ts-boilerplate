import express from 'express';
import { connectWithMongoDb } from './libraries/db';
import { start } from './server';

const initialize = (): void => {
  connectWithMongoDb();
  const app = express();
  start(app);
};

initialize();
