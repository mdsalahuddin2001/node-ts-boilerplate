import { BadRequestError } from '@/libraries/error-handling';
import logger from '@/libraries/log/logger';
import { QueryBuilder } from '@/libraries/query/QueryBuilder';
import { convertCart, verifyCartItems } from '../cart/service';
import Model, { IOrder } from './schema';
import { OrderInput } from './validation';
import { updateStockQuantity } from '../product/service';
import { withTransaction } from '@/libraries/utils/with-transaction';

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

const create = async (
  identifier: { userId?: string; sessionId?: string },
  orderInfo: OrderInput
): Promise<any> => {
  return withTransaction(async session => {
    logger.info('Order creation started', { identifier });
    // Verify cart items
    const { items, subtotal } = await verifyCartItems(identifier);

    // create order
    const order = await Model.create(
      [
        {
          ...orderInfo,
          items: items.map(item => ({
            product: item.product._id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            total: item.quantity * item.product.price,
          })),
          subtotal,
          total: subtotal,
        },
      ],
      { session }
    );

    const orderDoc = order[0];
    logger.info('Order created', { orderId: orderDoc._id });

    // Convert cart
    await convertCart(identifier, session);
    logger.info('Cart marked as converted', { identifier });

    // Update product stock
    await updateStockQuantity(items, session);
    logger.info('Stock updated', { productCount: items.length });

    logger.info('Order creation completed', { orderId: orderDoc._id });
    return orderDoc;
  });
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
    // .populate('category')
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
