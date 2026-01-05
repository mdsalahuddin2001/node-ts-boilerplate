import { BadRequestError } from '@/libraries/error-handling';
import { QueryBuilder } from '@/libraries/query/QueryBuilder';
import logger from '@/libraries/log/logger';
import Model from './schema';

interface SearchQuery {
  search?: string;
  sort?: string;
  limit?: string | number;
  page?: string | number;
}

// Create a new Vendor
export const create = async (data: any): Promise<any> => {
  const exists = await Model.findOne({ name: data.name });
  if (exists) {
    logger.error(`create(): Vendor already exists`, { name: data.name });
    throw new BadRequestError(`Vendor already exists`, `Vendor service create()`);
  }
  const item = await Model.create(data);
  logger.info(`create(): Vendor created`, { id: item._id });
  return item;
};

// Query Builder instance
const queryBuilder = new QueryBuilder({
  searchFields: ['name'],
  sortableFields: ['name', 'createdAt'],
  filterableFields: ['name', 'createdAt'],
  defaultSort: '-createdAt',
});

// Search Vendor
export const search = async (query: SearchQuery) => {
  const data = await queryBuilder.query(Model, query).paginate().execute();
  return data;
};

// Get Vendor by ID
export const getById = async (id: string): Promise<any> => {
  const item = await Model.findById(id);
  if (!item) {
    logger.info(`getById(): Vendor not found`, { id });
    return null;
  }
  logger.info(`getById(): Vendor fetched`, { id });
  return item;
};

// Update Vendor by ID
export const updateById = async (id: string, data: any): Promise<any> => {
  const item = await Model.findByIdAndUpdate(id, data, { new: true });
  if (!item) {
    logger.info(`updateById(): Vendor not found`, { id });
    return null;
  }
  logger.info(`updateById(): Vendor updated`, { id });
  return item;
};

// Delete Vendor by ID
export const deleteById = async (id: string): Promise<any> => {
  const item = await Model.findByIdAndDelete(id);
  if (!item) {
    logger.info(`deleteById(): Vendor not found`, { id });
    return null;
  }
  logger.info(`deleteById(): Vendor deleted`, { id });
  return item;
};
