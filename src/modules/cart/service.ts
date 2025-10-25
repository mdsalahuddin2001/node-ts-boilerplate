import logger from '@/libraries/log/logger';
import { BadRequestError, NotFoundError } from '@/libraries/error-handling';
import Model, { ICart } from './schema';
import { getById as getProductById } from '@/modules/product/service';
import { AddItemType, UpdateItemType } from './validation';

interface CartIdentifier {
  userId?: string;
  sessionId?: string;
}
const PRODUCT_PATH_IN_CART = 'items.product';
const PRODUCT_SELECT_FIELDS = 'name price thumbnail stockQuantity status';
// Get or create cart for authenticated user or guest
const getOrCreateCart = async ({ userId, sessionId }: CartIdentifier): Promise<ICart> => {
  const query: any = { status: 'active' };

  if (userId) {
    query.user = userId;
  } else if (sessionId) {
    query.sessionId = sessionId;
  } else {
    throw new BadRequestError('Either userId or sessionId is required', 'getOrCreateCart()');
  }

  let cart = await Model.findOne(query).populate({
    path: PRODUCT_PATH_IN_CART,
    select: PRODUCT_SELECT_FIELDS,
    populate: {
      path: 'thumbnail',
      select: 'url',
    },
  });

  if (!cart) {
    const cartData: any = {
      items: [],
      subtotal: 0,
      status: 'active',
    };

    if (userId) {
      cartData.user = userId;
    } else {
      cartData.sessionId = sessionId;
    }

    cart = await Model.create(cartData);
    logger.info(`getOrCreateCart(): New cart created`, { userId, sessionId });
  }

  return cart;
};

// Add item to cart
const addItem = async (identifier: CartIdentifier, data: AddItemType): Promise<ICart> => {
  const { product: productId, quantity } = data;

  // Verify product exists and has sufficient stock

  const product = await getProductById(productId);
  if (!product) {
    throw new NotFoundError('Product not found', 'addItem() cart service');
  }

  if (product.status !== 'active') {
    throw new BadRequestError('Product is not available', 'addItem() cart service product status');
  }

  if (product.stockQuantity < quantity) {
    throw new BadRequestError(
      `Insufficient stock. Only ${product.stockQuantity} items available`,
      'addItem() cart service product stockQuantity'
    );
  }

  // Get or create cart
  const query: any = { status: 'active' };
  if (identifier.userId) {
    query.user = identifier.userId;
  } else if (identifier.sessionId) {
    query.sessionId = identifier.sessionId;
  }

  let cart = await Model.findOne(query);

  if (!cart) {
    const cartData: any = {
      items: [],
      subtotal: 0,
      status: 'active',
    };

    if (identifier.userId) {
      cartData.user = identifier.userId;
    } else {
      cartData.sessionId = identifier.sessionId;
    }

    cart = new Model(cartData);
  }

  // Check if product already exists in cart
  const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);

  if (existingItemIndex > -1) {
    // Update existing item quantity
    // eslint-disable-next-line security/detect-object-injection
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;

    if (product.stockQuantity < newQuantity) {
      throw new BadRequestError(
        `Cannot add more items. Maximum available: ${product.stockQuantity}`,
        'addItem() cart service'
      );
    }

    // eslint-disable-next-line security/detect-object-injection
    cart.items[existingItemIndex].quantity = newQuantity;
  } else {
    // Add new item
    cart.items.push({
      product: product._id,
      quantity,
      price: product.price,
    });
  }

  // Recalculate subtotal
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  await cart.save();

  // Populate before returning
  await cart.populate({
    path: PRODUCT_PATH_IN_CART,
    select: PRODUCT_SELECT_FIELDS,
    populate: {
      path: 'thumbnail',
      select: 'url',
    },
  });

  logger.info(`addItem(): Item added to cart`, { ...identifier, productId, quantity });
  return cart;
};

// Update item quantity
const updateItem = async (identifier: CartIdentifier, data: UpdateItemType): Promise<ICart> => {
  const { product: productId, quantity } = data;

  const query: any = { status: 'active' };
  if (identifier.userId) {
    query.user = identifier.userId;
  } else if (identifier.sessionId) {
    query.sessionId = identifier.sessionId;
  }

  const cart = await Model.findOne(query);
  if (!cart) {
    throw new NotFoundError('No cart found', 'updateItem() cart service cart not found');
  }

  const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

  if (itemIndex === -1) {
    throw new NotFoundError('Item not found in cart', 'updateItem() cart service item not found');
  }

  // Verify stock availability
  const product = await getProductById(productId);
  if (!product) {
    throw new NotFoundError('Product not found', 'updateItem() cart service product not found');
  }

  if (product.stockQuantity < quantity) {
    throw new BadRequestError(
      `Insufficient stock. Only ${product.stockQuantity} items available`,
      'updateItem() cart service'
    );
  }

  // Update quantity
  // eslint-disable-next-line security/detect-object-injection
  cart.items[itemIndex].quantity = quantity;
  // eslint-disable-next-line security/detect-object-injection
  cart.items[itemIndex].price = product.price; // Update price in case it changed

  // Recalculate subtotal
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  await cart.save();

  // Populate before returning
  await cart.populate({
    path: PRODUCT_PATH_IN_CART,
    select: PRODUCT_SELECT_FIELDS,
    populate: {
      path: 'thumbnail',
      select: 'url',
    },
  });

  logger.info(`updateItem(): Cart item updated`, { ...identifier, productId, quantity });
  return cart;
};

// Remove item from cart
const removeItem = async (identifier: CartIdentifier, productId: string): Promise<ICart> => {
  const query: any = { status: 'active' };
  if (identifier.userId) {
    query.user = identifier.userId;
  } else if (identifier.sessionId) {
    query.sessionId = identifier.sessionId;
  }

  const cart = await Model.findOne(query);
  if (!cart) {
    throw new NotFoundError('Cart not found', 'removeItem() cart service');
  }

  const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

  if (itemIndex === -1) {
    throw new NotFoundError('Item not found in cart', 'removeItem() cart service');
  }

  // Remove item
  cart.items.splice(itemIndex, 1);

  // Recalculate subtotal
  cart.subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  await cart.save();

  // Populate before returning
  await cart.populate({
    path: PRODUCT_PATH_IN_CART,
    select: PRODUCT_SELECT_FIELDS,
    populate: {
      path: 'thumbnail',
      select: 'url',
    },
  });

  logger.info(`removeItem(): Item removed from cart`, { ...identifier, productId });
  return cart;
};

// Clear cart
const clearCart = async (identifier: CartIdentifier): Promise<ICart> => {
  const query: any = { status: 'active' };
  if (identifier.userId) {
    query.user = identifier.userId;
  } else if (identifier.sessionId) {
    query.sessionId = identifier.sessionId;
  }

  const cart = await Model.findOne(query);
  if (!cart) {
    throw new NotFoundError('Cart not found', 'clearCart() cart service');
  }

  cart.items = [];
  cart.subtotal = 0;

  await cart.save();

  logger.info(`clearCart(): Cart cleared`, identifier);
  return cart;
};

// Get cart
const getCart = async (identifier: CartIdentifier): Promise<ICart> => {
  const cart = await getOrCreateCart(identifier);
  logger.info(`getCart(): Cart fetched`, identifier);
  return cart;
};

// Merge guest cart into user cart when user logs in
const mergeGuestCart = async (sessionId: string, userId: string): Promise<ICart> => {
  const guestCart = await Model.findOne({ sessionId, status: 'active' });

  if (!guestCart || guestCart.items.length === 0) {
    // No guest cart or empty, just return/create user cart
    return getOrCreateCart({ userId });
  }

  const userCart = await Model.findOne({ user: userId, status: 'active' });

  if (!userCart) {
    // Convert guest cart to user cart
    guestCart.user = userId as any;
    guestCart.sessionId = undefined;
    await guestCart.save();

    await guestCart.populate({
      path: PRODUCT_PATH_IN_CART,
      select: PRODUCT_SELECT_FIELDS,
      populate: {
        path: 'thumbnail',
        select: 'url',
      },
    });

    logger.info('mergeGuestCart(): Guest cart converted to user cart', { sessionId, userId });
    return guestCart;
  }

  // Merge guest cart items into user cart
  for (const guestItem of guestCart.items) {
    const existingItemIndex = userCart.items.findIndex(
      item => item.product.toString() === guestItem.product.toString()
    );

    if (existingItemIndex > -1) {
      // Add quantities
      // eslint-disable-next-line security/detect-object-injection
      userCart.items[existingItemIndex].quantity += guestItem.quantity;
    } else {
      // Add new item
      userCart.items.push(guestItem);
    }
  }

  // Recalculate subtotal
  userCart.subtotal = userCart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  await userCart.save();

  // Mark guest cart as converted
  guestCart.status = 'converted';
  await guestCart.save();

  // Populate before returning
  await userCart.populate({
    path: PRODUCT_PATH_IN_CART,
    select: PRODUCT_SELECT_FIELDS,
    populate: {
      path: 'thumbnail',
      select: 'url',
    },
  });

  logger.info('mergeGuestCart(): Carts merged successfully', { sessionId, userId });
  return userCart;
};

// Verify cart items before checkout
const verifyCartItems = async (identifier: CartIdentifier) => {
  const query: any = { status: 'active' };
  if (identifier.userId) {
    query.user = identifier.userId;
  } else if (identifier.sessionId) {
    query.sessionId = identifier.sessionId;
  }

  const cart = await Model.findOne(query).populate(
    PRODUCT_PATH_IN_CART,
    'name price stockQuantity status'
  );

  if (!cart || cart.items.length === 0) {
    throw new BadRequestError('Cart is empty', 'verifyCartItems() cart service');
  }

  const errors: string[] = [];
  let subtotal = 0;

  for (const item of cart.items) {
    const product = item.product as any;

    if (!product) {
      errors.push(`Product no longer exists`);
      continue;
    }

    if (product.status !== 'active') {
      errors.push(`Product "${product.name}" is no longer available`);
      continue;
    }

    if (product.stockQuantity < item.quantity) {
      errors.push(
        `Insufficient stock for "${product.name}". Only ${product.stockQuantity} available`
      );
      continue;
    }

    // Check if price has changed
    if (product.price !== item.price) {
      item.price = product.price;
    }

    subtotal += item.price * item.quantity;
  }

  if (errors.length > 0) {
    throw new BadRequestError(
      `Cart verification failed: ${errors.join(', ')}`,
      'verifyCartItems() cart service'
    );
  }

  // Update subtotal if prices changed
  if (cart.subtotal !== subtotal) {
    cart.subtotal = subtotal;
    await cart.save();
  }

  return {
    cart,
    subtotal,
    items: cart.items,
  };
};

export {
  getOrCreateCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  getCart,
  mergeGuestCart,
  verifyCartItems,
};
