import logger from '../../libraries/log/logger';
import { ServerError } from '@/libraries/error-handling';
import Model, { IProduct } from './schema';

const model: string = 'product';

// Create function with type annotations
const create = async (data: IProduct): Promise<IProduct> => {
  try {
    const item = new Model(data);
    const saved = await item.save();
    logger.info(`create(): ${model} created`, {
      id: saved._id,
    });
    return saved;
  } catch (error) {
    logger.error(`create(): Failed to create ${model}`, error);
    throw new ServerError(`Failed to create ${model}`, 'product create() method');
  }
};

// Define the type for the search query
interface SearchQuery {
  keyword?: string;
}

// Define the search function with type annotations
const search = async (query: SearchQuery): Promise<IProduct[]> => {
  try {
    const { keyword } = query ?? {};
    const filter: Record<string, unknown> = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    const items = await Model.find(filter);
    logger.info('search(): filter and count', {
      filter,
      count: items.length,
    });

    return items;
  } catch (error) {
    logger.error(`search(): Failed to search ${model}`, error);
    throw new ServerError(`Failed to search ${model}`, 'product search() method');
  }
};

// Define the getById function
const getById = async (id: string): Promise<IProduct | null> => {
  try {
    const item = await Model.findById(id);
    logger.info(`getById(): ${model} fetched`, { id });
    return item;
  } catch (error) {
    logger.error(`getById(): Failed to get ${model}`, error);
    throw new ServerError(`Failed to get ${model}`, 'product getById() method');
  }
};

const updateById = async (id: string, data: Partial<IProduct>): Promise<IProduct | null> => {
  try {
    const item = await Model.findByIdAndUpdate(id, data, { new: true });
    logger.info(`updateById(): ${model} updated`, { id });
    return item;
  } catch (error) {
    logger.error(`updateById(): Failed to update ${model}`, error);
    throw new ServerError(`Failed to update ${model}`, 'product updateById() method');
  }
};

const deleteById = async (id: string): Promise<boolean> => {
  try {
    await Model.findByIdAndDelete(id);
    logger.info(`deleteById(): ${model} deleted`, { id });
    return true;
  } catch (error) {
    logger.error(`deleteById(): Failed to delete ${model}`, error);
    throw new ServerError(`Failed to delete ${model}`, 'product deleteById() method');
  }
};

export { create, deleteById, getById, search, updateById };
