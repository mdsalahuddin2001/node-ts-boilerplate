import mongoose from 'mongoose';
import config from '../../configs';
import logger from '../log/logger';

const connectWithMongoDb = async (): Promise<void> => {
  console.log('called connect with mongodb');
  try {
    const MONGODB_URI = config.MONGODB_URI as string;

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in config');
    }

    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      logger.info('Already connected to MongoDB');
      return;
    }

    if (mongoose.connection.readyState === 2) {
      logger.info('Connection to MongoDB is in progress');
      return;
    }

    logger.info('Connecting to MongoDB...');

    // Register connection event listeners BEFORE connecting
    mongoose.connection.once('open', () => {
      logger.info('MongoDB connection is open');
    });

    mongoose.connection.on('error', (error: Error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Global settings and plugins
    function setRunValidators() {
      return { runValidators: true };
    }

    mongoose.set('strictQuery', true);

    await mongoose
      .plugin(schema => {
        schema.pre('findOneAndUpdate', setRunValidators);
        schema.pre('updateMany', setRunValidators);
        schema.pre('updateOne', setRunValidators);
      })
      .connect(MONGODB_URI, {
        autoIndex: true,
        autoCreate: true,
        maxPoolSize: 25,
        minPoolSize: 10,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      });

    logger.info('Successfully connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error; // Re-throw to let caller handle
  }
};

const disconnectWithMongoDb = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState === 0) {
      logger.info('Already disconnected from MongoDB');
      return;
    }

    logger.info('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    logger.info('Successfully disconnected from MongoDB');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

// Utility function to get connection status
const getConnectionStatus = (): string => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
};

// Graceful shutdown handler
const handleGracefulShutdown = async (): Promise<void> => {
  logger.info('Received shutdown signal, closing MongoDB connection...');
  await disconnectWithMongoDb();
  process.exit(0);
};

// Register shutdown handlers
process.on('SIGINT', handleGracefulShutdown);
process.on('SIGTERM', handleGracefulShutdown);

export { connectWithMongoDb, disconnectWithMongoDb, getConnectionStatus };
