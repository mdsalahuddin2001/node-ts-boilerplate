// src/crons/jobs/clean-temp-files.cron.ts
import cron from 'node-cron';
import FileModel from '@/modules/file/schema';
import logger from '@/libraries/log/logger';
import { deleteManyFromS3 } from '@/libraries/aws/s3';
import mongoose from 'mongoose';

export const cleanTempFilesCron = cron.schedule('*/30 * * * * *', async () => {
  logger.info('🧹 Cleaning temporary files...');

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    // 1. Find all temporary files
    const tempFiles = await FileModel.find({
      isTemporary: true,
      createdAt: { $lte: twoMinutesAgo }, // created 2+ mins ago
    }).select('key');

    if (!tempFiles.length) {
      logger.info('No temporary files found.');
      await session.commitTransaction();
      session.endSession();
      return;
    }

    const keys = tempFiles.map(file => file.key);

    // 2. Delete from S3
    await deleteManyFromS3(keys);
    logger.info(`🗑️ Deleted ${keys.length} files from S3`);

    // 3. Delete from DB
    const result = await FileModel.deleteMany({ isTemporary: true }).session(session);
    await session.commitTransaction();

    logger.info(`🧾 Deleted ${result.deletedCount} temporary file records from DB`);
  } catch (error) {
    await session.abortTransaction();
    logger.error('❌ Failed to clean temporary files:', error);
  } finally {
    session.endSession();
  }
});
