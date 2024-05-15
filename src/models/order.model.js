import { Schema, model } from 'mongoose';

const selectedStockItemSchema = new Schema({
  NameOfProduct: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  itemTotalPrice: {
    type: Number,
    required: true,
  }
});

const orderSchema = new Schema({
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  selectedStockItems: [selectedStockItemSchema],
  totalItems: {
    type: Number,
    default: 0,
  },
  totalAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  shippingAddress: {
    type: String,
    required: true,
  },
}, { timestamps: true });

const orderModel = model('Order', orderSchema);
export default orderModel;
