import mongoose, { Schema, Document, Model } from 'mongoose';
import { baseSchema } from '@/libraries/db/base-schema';

// Define interfaces for nested objects
export interface IOrderItem {
  product: mongoose.Schema.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface IShippingAddress {
  name: string;
  phone: string;
  email?: string;
  address: string;
  district: string;
  upazila: string;
}

// Define an interface for the Order document
export interface IOrder extends Document {
  // orderNumber: string;
  customer?: mongoose.Schema.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'celfin' | 'bkash' | 'nagad' | 'ibbl';
  paymentStatus?: 'pending' | 'paid' | 'failed';
  subtotal: number;
  shippingCost: number;
  total: number;
  transactionID?: string;
}

// Create the schema with TypeScript
const orderSchema = new Schema<IOrder>({
  // orderNumber: {
  //   type: String,
  //   required: true,
  //   unique: true,
  // },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
      total: {
        type: Number,
        required: true,
      },
    },
  ],
  shippingAddress: {
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    upazila: {
      type: String,
      required: true,
    },
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['cod', 'celfin', 'bkash', 'nagad', 'ibbl'],
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'failed'],
  },
  subtotal: {
    type: Number,
    required: true,
  },
  shippingCost: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  transactionID: {
    type: String,
    required: false,
  },
});

// Add the base schema properties
orderSchema.add(baseSchema);

// Add indexes for better performance
// orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

// Create and export the model
const OrderModel: Model<IOrder> = mongoose.model<IOrder>('Order', orderSchema);

export default OrderModel;
