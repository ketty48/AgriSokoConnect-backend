

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

// Calculate tax amount
function calculateTaxAmount(transactionAmount) {
  return transactionAmount * 0.18; // Assuming 18% tax rate
}

const calculateTransactionAndTax = async function(next) {
  if (this.isModified('quantity')) {
      const stockItem = await this.constructor.findById(this._id); // Fetch the current stock item
      const oldQuantity = stockItem ? stockItem.quantity : 0;

      // Only proceed if the quantity is being reduced
      if (this.quantity < oldQuantity) {
          console.log('Stock quantity reduced:', this.quantity);

          const quantityReduced = oldQuantity - this.quantity; // Calculate the reduced quantity
          const transactionAmount = calculateTransactionAmount(quantityReduced, this.pricePerTon);
          console.log('Calculated Transaction Amount:', transactionAmount);

          const taxAmount = calculateTaxAmount(transactionAmount);
          console.log('Calculated Tax Amount:', taxAmount);

          const date = new Date();
          const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
          const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

          // Find existing transaction and tax records for the current month
          const existingTransaction = await TransactionAndTax.findOne({
              user: this.user,
              type: 'Transaction',
              date: { $gte: startOfMonth, $lte: endOfMonth }
          });

          const existingTax = await TransactionAndTax.findOne({
              user: this.user,
              type: 'Tax',
              date: { $gte: startOfMonth, $lte: endOfMonth }
          });

          if (existingTransaction) {
              // Update existing transaction
              existingTransaction.amount += transactionAmount;
              await existingTransaction.save();
              console.log('Updated existing Transaction record');
          } else {
              // Create new transaction
              await TransactionAndTax.create({ user: this.user, type: 'Transaction', amount: transactionAmount, date });
              console.log('New Transaction record created');
          }

          if (existingTax) {
              // Update existing tax
              existingTax.amount += taxAmount;
              await existingTax.save();
              console.log('Updated existing Tax record');
          } else {
              // Create new tax
              await TransactionAndTax.create({ user: this.user, type: 'Tax', amount: taxAmount, date });
              console.log('New Tax record created');
          }
      }
  }

  next();
};

stockSchema.pre('save', calculateTransactionAndTax);

const stockModel = model('stock', stockSchema);
export default stockModel;
