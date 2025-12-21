import express from 'express';
import { connectWithMongoDb } from './libraries/db';
import { start } from './server';

const initialize = async (): Promise<void> => {
  console.log('start connecting to mongodb...');
  await connectWithMongoDb();
  console.log('mongodb connecting ends');
  const app = express();
  start(app);
};

initialize();
