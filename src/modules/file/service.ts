import Model, { IFile } from './schema';

// const model: string = 'File';

const create = async (data: IFile): Promise<IFile> => {
  const file = await Model.create(data);
  return file;
};

export { create };
