// mongoose-transaction.ts
import mongoose from 'mongoose';
import logger from '@/libraries/log/logger';

export const withTransaction = async (fn: (session: mongoose.ClientSession) => Promise<any>) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await fn(session);
    await session.commitTransaction();
    logger.info('Transaction committed');
    return result;
  } catch (err: any) {
    await session.abortTransaction();
    logger.error('Transaction aborted', { message: err?.message, stack: err?.stack });
    throw err;
  } finally {
    session.endSession();
  }
};
