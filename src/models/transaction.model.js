import mongoose from 'mongoose'
const transactionSchema = new mongoose.Schema({
    stock: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stock'
    },
    quantity: Number,
    date:Date,
    


});

const Transaction = mongoose.model('Transaction', transactionSchema);
