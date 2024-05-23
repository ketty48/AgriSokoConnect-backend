

import {Schema , model} from 'mongoose';
import TransactionAndTax from './transaction.model.js'
const stockSchema = new Schema({
 user:{

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
function calculateTransactionAmount(quantity, pricePerTon) {
  return quantity * pricePerTon;
}

function calculateTaxAmount(transactionAmount) {
  return transactionAmount * 0.18; // Assuming 18% tax rate
}

const calculateTransactionAndTax = async function(next) {
  if (this.isModified('quantity')) {
      console.log('Stock quantity modified:', this.quantity);

      const transactionAmount = calculateTransactionAmount(this.quantity, this.pricePerTon);
      console.log('Calculated Transaction Amount:', transactionAmount);

      const taxAmount = calculateTaxAmount(transactionAmount);
      console.log('Calculated Tax Amount:', taxAmount);

      await TransactionAndTax.create({ user: this.user, type: 'Transaction', amount: transactionAmount });
      console.log('Transaction record created');

      await TransactionAndTax.create({ user: this.user, type: 'Tax', amount: taxAmount });
      console.log('Tax record created');
  }

  next();
};

stockSchema.pre('save', calculateTransactionAndTax);
const stockModel = model('stock', stockSchema);
export default stockModel;
