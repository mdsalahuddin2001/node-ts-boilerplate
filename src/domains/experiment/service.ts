import logger from '../../libraries/log/logger';
import Model from './schema';
import { AppError } from '../../libraries/error-handling/AppError';

const model: string = 'product';

interface IData {
  [key: string]: any;
}

const create = async (data: IData): Promise<any> => {
  try {
    const item = new Model(data);
    const saved = await item.save();
    logger.info(`create(): model created`, {
      id: saved._id
    });
    return saved;
  } catch (error: any) {
    logger.error(`create(): Failed to create model`, error);
    throw new AppError(`Failed to create model`, error.message);
  }
};

interface SearchQuery {
  keyword?: string;
}

const search = async (query: SearchQuery): Promise<any[]> => {
  try {
    const { keyword } = query ?? {};
    const filter: any = {};
    if (keyword) {
      filter.or = [
        { name: { regex: keyword, options: 'i' } },
        { description: { regex: keyword, options: 'i' } }
      ];
    }
    const items = await Model.find(filter);
    logger.info('search(): filter and count', {
      filter,
      count: items.length
    });
    return items;
  } catch (error: any) {
    logger.error(`search(): Failed to search model`, error);
    throw new AppError(`Failed to search model`, error.message, 400);
  }
};

const getById = async (id: string): Promise<any> => {
  try {
    const item = await Model.findById(id);
    logger.info(`getById(): model fetched`, { id });
    return item;
  } catch (error: any) {
    logger.error(`getById(): Failed to get model`, error);
    throw new AppError(`Failed to get model`, error.message);
  }
};

const updateById = async (id: string, data: IData): Promise<any> => {
  try {
    const item = await Model.findByIdAndUpdate(id, data, { new: true });
    logger.info(`updateById(): model updated`, { id });
    return item;
  } catch (error: any) {
    logger.error(`updateById(): Failed to update model`, error);
    throw new AppError(`Failed to update model`, error.message);
  }
};

const deleteById = async (id: string): Promise<boolean> => {
  try {
    await Model.findByIdAndDelete(id);
    logger.info(`deleteById(): model deleted`, { id });
    return true;
  } catch (error: any) {
    logger.error(`deleteById(): Failed to delete model`, error);
    throw new AppError(`Failed to delete model`, error.message);
  }
};

export { create, search, getById, updateById, deleteById };
