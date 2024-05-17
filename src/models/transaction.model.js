// models/transactionAndTax.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const TransactionAndTaxSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Transaction', 'Tax'], required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

const TransactionAndTax = mongoose.model('TransactionAndTax', TransactionAndTaxSchema);
export default TransactionAndTax;
