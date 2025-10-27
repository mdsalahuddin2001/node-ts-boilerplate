import { ICart, ICartItem } from './schema';
import { IProduct } from '@/modules/product/schema'; // adjust import alias as per your structure

export type PopulatedCart = Omit<ICart, 'items'> & {
  items: (Omit<ICartItem, 'product'> & { product: IProduct })[];
};
