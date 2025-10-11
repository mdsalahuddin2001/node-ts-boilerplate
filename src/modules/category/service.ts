import logger from '@/libraries/log/logger';
import { QueryBuilder } from '@/libraries/query/QueryBuilder';
import Model, { ICategory } from './schema';
import { BadRequestError } from '@/libraries/error-handling';

const model: string = 'Category';

interface IData {
  [key: string]: any;
}

const queryBuilder = new QueryBuilder({
  searchFields: ['name'],
  sortableFields: ['name', 'createdAt'],
  filterableFields: ['name', 'createdAt'],
  defaultSort: 'createdAt',
});

const create = async (data: IData): Promise<any> => {
  const item = new Model(data);
  const saved = await item.save();
  logger.info(`create(): ${model} created`, {
    id: saved._id,
  });
  return saved;
};

interface SearchQuery {
  search?: string;
  sort?: string;
  limit?: string | number;
  page?: string | number;
}

const search = async (query: SearchQuery) => {
  const data = await queryBuilder
    .query(Model, query)
    .paginate()
    .populate('parentId')
    .lean()
    .execute();
  return data;
};

// ------ Get category tree ------
function nestedCategories(
  categories: ICategory[],
  parentId: string | null = null
): { _id: string; name: string; children: any[] }[] {
  const categoryList = [];
  let category: ICategory[];
  if (parentId == null) {
    category = categories.filter(cat => cat.parentId == null);
  } else {
    category = categories.filter(cat => String(cat.parentId) == String(parentId));
  }

  for (const cate of category) {
    categoryList.push({
      _id: cate._id,
      name: cate.name,
      children: nestedCategories(categories, cate._id as string | null),
    });
  }
  return categoryList as { _id: string; name: string; children: any[] }[];
}
const getTree = async () => {
  const categories = await Model.find({});
  if (categories.length === 0) {
    return [];
  }
  return nestedCategories(categories);
};

const getById = async (id: string): Promise<any> => {
  const item = await Model.findById(id);
  logger.info(`getById(): ${model} fetched`, { id });
  return item;
};

const updateById = async (id: string, data: IData): Promise<any> => {
  try {
    const item = await Model.findByIdAndUpdate(id, data, { new: true });
    logger.info(`updateById(): model updated`, { id });
    return item;
  } catch (error: any) {
    logger.error(`updateById(): Failed to update model`, error);
  }
};

const deleteById = async (id: string): Promise<ICategory | null> => {
  const deletedItem = await Model.findByIdAndDelete(id);
  if (!deletedItem) {
    logger.error(`deleteById(): Failed to delete model`, { id });
    throw new BadRequestError('Item not found', `deleteById() ${model}-${id} failed`);
  }
  return deletedItem;
};

export { create, deleteById, getById, getTree, search, updateById };
