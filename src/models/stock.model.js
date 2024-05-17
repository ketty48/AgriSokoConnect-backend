import { Schema, model } from 'mongoose';

const stockSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  NameOfProduct: {
    type: String,
    required: false
  },
  description: { 
    type: String,
    required: false
  },
  pricePerTon: {
    type: Number,
    required: false
  },
  quantity: {
    type: Number,
    required: false
  },
  totalPrice: {
    type: Number,
    required: false
  },
  typeOfProduct: { 
    type: String,
    required: false
  },
  image: { 
    type: String,
    required: false
  }
}, { timestamps: true });

const stockModel = model('stock', stockSchema);
export default stockModel;
