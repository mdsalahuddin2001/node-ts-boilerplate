import logger from '@/libraries/log/logger';
import { QueryBuilder } from '@/libraries/query/QueryBuilder';
import Model, { IOrder } from './schema';
import { BadRequestError } from '@/libraries/error-handling';
import { OrderInput } from './validation';
import ProductModel from '../product/schema';

const model: string = 'Order';

interface IData {
  [key: string]: any;
}

const queryBuilder = new QueryBuilder({
  searchFields: ['name', 'description'],
  sortableFields: ['name', 'createdAt', 'price', 'rating'],
  filterableFields: ['name', 'createdAt'],
  defaultSort: 'createdAt',
});

const create = async (orderData: OrderInput): Promise<any> => {
  const { items } = orderData;
  const productIds = items.map(i => i.product);
  const products = await ProductModel.find({ _id: { $in: productIds } })
    .select('name price stockQuantity')
    .lean();
  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  let subtotal = 0;
  const populatedItems = [];
  for (const item of items) {
    const productDoc = productMap.get(item.product.toString());
    if (!productDoc)
      throw new BadRequestError(`Invalid product ID: ${item.product}`, 'create() order method');

    // ✅ Stock check
    if (productDoc.stockQuantity < item.quantity) {
      throw new BadRequestError(
        `Product "${productDoc.name}" is out of stock or not enough quantity available`,
        'create() order method'
      );
    }

    const total = productDoc.price * item.quantity;
    subtotal += total;

    populatedItems.push({
      product: productDoc._id,
      name: productDoc.name,
      price: productDoc.price,
      quantity: item.quantity,
      total,
    });
  }

  const order = await Model.create({
    ...orderData,
    items: populatedItems,
    subtotal,
    total: subtotal + 0,
  });
  return order;
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
    .populate('category')
    .lean()
    .execute();
  return data;
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

const deleteById = async (id: string): Promise<IOrder | null> => {
  const deletedItem = await Model.findByIdAndDelete(id);
  if (!deletedItem) {
    logger.error(`deleteById(): Failed to delete model`, { id });
    throw new BadRequestError('Item not found', `deleteById() ${model}-${id} failed`);
  }
  return deletedItem;
};

export { create, deleteById, getById, search, updateById };
