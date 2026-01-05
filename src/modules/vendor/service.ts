import { BadRequestError } from '@/libraries/error-handling';
import { QueryBuilder } from '@/libraries/query/QueryBuilder';
import logger from '@/libraries/log/logger';
import Model, { IVendor } from './schema';
import { withTransaction } from '@/libraries/utils/with-transaction';
import { create as createUser } from '@/modules/user/service';

interface SearchQuery {
  search?: string;
  sort?: string;
  limit?: string | number;
  page?: string | number;
}

// Create a new Vendor
export const create = async ({
  email,
  name,
  password,
  role,
  shopName,
  description,
  address,
}: {
  email: string;
  name: string;
  password: string;
  role: 'vendor';
  shopName: string;
  description: string;
  address: string;
}): Promise<IVendor | null> => {
  return withTransaction(async session => {
    const user = await createUser({ email, name, password, role }, session);
    if (!user) {
      logger.error(`createVendor(): failed to create user`, { email });
      throw new BadRequestError(`failed to create user`, `auth service createVendor() method`);
    }
    const vendor = new Model({ userId: user._id, shopName, description, address });
    await vendor.save({ session });
    await vendor.populate('userId');
    if (!vendor) {
      logger.error(`createVendor(): failed to create vendor`, { email });
      throw new BadRequestError(`failed to create vendor`, `auth service createVendor() method`);
    }
    return vendor;
  });
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
export const getById = async (id: string): Promise<IVendor | null> => {
  const item = await Model.findById(id);
  if (!item) {
    logger.info(`getById(): Vendor not found`, { id });
    return null;
  }
  logger.info(`getById(): Vendor fetched`, { id });
  return item;
};

// Update Vendor by ID
export const updateById = async (id: string, data: Partial<IVendor>): Promise<IVendor | null> => {
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
