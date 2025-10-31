import logger from '@/libraries/log/logger';
import { QueryBuilder } from '@/libraries/query/QueryBuilder';
import Model, { IProduct } from './schema';
import { BadRequestError } from '@/libraries/error-handling';
import { SearchQueryType } from './validation';
import { ClientSession } from 'mongoose';
import { fileQueue } from '@/libraries/bullmq';

const model: string = 'Product';

interface IData {
  [key: string]: any;
}

// Query Builder
const queryBuilder = new QueryBuilder({
  searchFields: ['name', 'description', 'slug'],
  sortableFields: ['name', 'createdAt', 'price', 'rating', 'stockQuantity'],
  filterableFields: ['name', 'createdAt', 'category', 'price', 'stockQuantity'],
  defaultSort: '-createdAt',
});

const create = async (data: IData): Promise<any> => {
  const item = new Model(data);
  const saved = await item.save();
  logger.info(`create(): ${model} created`, {
    id: saved._id,
  });
  const files = [];
  if (saved?.thumbnail) files.push(saved.thumbnail);
  if (item?.gallery) files.push(...item.gallery);
  fileQueue.add('fileQueue', files);
  return saved;
};

const search = async (query: SearchQueryType) => {
  const data = await queryBuilder
    .query(Model, query)
    .paginate()
    .populate(['category', 'thumbnail', 'gallery'])
    // .where({ stockQuantity: { $gt: 0 } })
    .execute();
  return data;
};

const getById = async (id: string): Promise<any> => {
  const item = await Model.findById(id).populate(['category', 'thumbnail', 'gallery']);
  logger.info(`getById(): ${model} fetched`, { id });
  return item;
};

const updateById = async (id: string, data: IData): Promise<any> => {
  const item = await Model.findByIdAndUpdate(id, data, { new: true });
  logger.info(`updateById(): model updated`, { id });
  return item;
};

const deleteById = async (id: string): Promise<IProduct | null> => {
  const deletedItem = await Model.findByIdAndDelete(id);
  return deletedItem;
};

// ✅ Stock check
const verifyStockQuantity = async (items: { product: string; quantity: number }[]) => {
  const productIds = items.map(i => i.product);
  const products = await Model.find({ _id: { $in: productIds } })
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

  return {
    subtotal,
    populatedItems,
  };
};

// Update Stock Quantity with session support
const updateStockQuantity = async (
  items: { product: IProduct; quantity: number }[],
  session?: ClientSession
) => {
  for (const item of items) {
    const result = await Model.updateOne(
      {
        _id: item.product._id,
        stockQuantity: { $gte: item.quantity }, // ✅ Atomic check-and-update
      },
      { $inc: { stockQuantity: -item.quantity } },
      { session } // ✅ Pass session for transaction
    );

    if (result.modifiedCount === 0) {
      throw new BadRequestError(
        `Insufficient stock for ${item.product.name}`,
        'updateStockQuantity() method'
      );
    }
  }
};

export {
  create,
  deleteById,
  getById,
  search,
  updateById,
  verifyStockQuantity,
  updateStockQuantity,
};
