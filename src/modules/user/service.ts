import { BadRequestError } from '@/libraries/error-handling';
import { QueryBuilder } from '@/libraries/query/QueryBuilder';
import bcrypt from 'bcrypt';
import logger from '../../libraries/log/logger';
import Model, { IUser } from './schema';
interface SearchQuery {
  search?: string;
  sort?: string;
  limit?: string | number;
  page?: string | number;
}

const model: string = 'User';

// Create a new user
export const create = async ({
  email,
  name,
  password,
  role,
}: {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user';
}): Promise<IUser | null> => {
  const item = await Model.findOne({ email });
  if (item) {
    logger.error(`create(): ${model} already exists`, { email });
    throw new BadRequestError(`${model} already exists`, `user service create() method`);
  }
  const newItem = await Model.create({ email, name, password, role });

  logger.info(`create(): ${model} created`, { email });
  return newItem;
};

// Quer Builder
const queryBuilder = new QueryBuilder({
  searchFields: ['name', 'email'],
  sortableFields: ['name', 'createdAt', 'email', 'role'],
  filterableFields: ['name', 'createdAt', 'role'],
  defaultSort: '-createdAt',
});

// Search users
export const search = async (query: SearchQuery) => {
  const data = await queryBuilder.query(Model, query).paginate().execute();
  return data;
};

// Get current user
export const getCurrent = async (userId: string): Promise<IUser | null> => {
  const item = await Model.findById(userId).select('-password');
  if (!item) {
    logger.info(`getCurrent(): ${model} not found`, { userId });
    return null;
  }
  logger.info(`getCurrent(): ${model} fetched`, { userId });
  return item;
};

// Update current user
export const updateUserById = async (
  userId: string,
  data: Partial<IUser>
): Promise<IUser | null> => {
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  const item = await Model.findByIdAndUpdate(userId, data, { new: true }).select('-password');
  if (!item) {
    logger.info(`updateUserById(): ${model} not found`, { userId });
    return null;
  }
  logger.info(`updateUserById(): ${model} updated`, { userId });
  return item;
};

// Get user by email
export const getByEmail = async (email: string): Promise<IUser | null> => {
  const item = await Model.findOne({ email });
  if (!item) {
    logger.info(`getByEmail(): ${model} not found`, { email });
    return null;
  }
  logger.info(`getByEmail(): ${model} fetched`, { email });
  return item;
};
// Get user by id
export const getById = async (userId: string): Promise<IUser | null> => {
  const item = await Model.findById(userId);
  if (!item) {
    logger.info(`getByEmail(): ${model} not found`, { userId });
    return null;
  }
  logger.info(`getById(): ${model} fetched`, { userId });
  return item;
};
