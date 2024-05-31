import { Schema, model } from "mongoose";
import TransactionAndTax from "./transaction.model.js";

const stockSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    NameOfProduct: {
      type: String,
      required: false,
    },
    Description: {
      type: String,
      required: false,
    },
    pricePerTon: {
      type: Number,
      required: false,
    },
    quantity: {
      type: Number,
      required: false,
    },
    typeOfProduct: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
    totalPrice: {
      type: Number,
      required: false,
    },
  },
  { timestamps: true }
);

// Pre-save middleware to calculate totalPrice
stockSchema.pre("save", function (next) {
  // Check if quantity and pricePerTon are available
  if (this.quantity !== undefined && this.pricePerTon !== undefined) {
    this.totalPrice = this.quantity * this.pricePerTon;
  }
  next();
});



// Function to calculate transaction amount
function calculateTransactionAmount(quantity, pricePerTon) {
  return quantity * pricePerTon;
}

// Function to calculate tax amount
function calculateTaxAmount(transactionAmount) {
  return transactionAmount * 0.18; // Assuming 18% tax rate
}

// Pre-save middleware to calculate transaction and tax
const calculateTransactionAndTax = async function (next) {
  if (this.isModified("quantity")) {
    const stockItem = await this.constructor.findById(this._id);
    const oldQuantity = stockItem ? stockItem.quantity : 0;

    if (this.quantity < oldQuantity) {
      const quantityReduced = oldQuantity - this.quantity;
      const transactionAmount = calculateTransactionAmount(
        quantityReduced,
        this.pricePerTon
      );
      const taxAmount = calculateTaxAmount(transactionAmount);

      const date = new Date();
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const existingTransaction = await TransactionAndTax.findOne({
        user: this.user,
        type: "Transaction",
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const existingTax = await TransactionAndTax.findOne({
        user: this.user,
        type: "Tax",
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      if (existingTransaction) {
        existingTransaction.amount += transactionAmount;
        await existingTransaction.save();
      } else {
        await TransactionAndTax.create({
          user: this.user,
          type: "Transaction",
          amount: transactionAmount,
          date,
        });
      }

      if (existingTax) {
        existingTax.amount += taxAmount;
        await existingTax.save();
      } else {
        await TransactionAndTax.create({
          user: this.user,
          type: "Tax",
          amount: taxAmount,
          date,
        });
      }
    }
  }

  next();
};

stockSchema.pre("save", calculateTransactionAndTax);

const stockModel = model("stock", stockSchema);
export default stockModel;
