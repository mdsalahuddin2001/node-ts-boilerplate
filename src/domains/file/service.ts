import { UploadResult } from '@/libraries/aws/s3';
import Model, { IFile } from './schema';

// const model: string = 'File';

const create = async (data: UploadResult): Promise<IFile> => {
  const file = await Model.create(data);
  return file;
};

export { create };
