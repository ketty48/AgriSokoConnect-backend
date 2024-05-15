// Import required modules and define schema
import mongoose from 'mongoose';

const { Schema } = mongoose;

const stockTransactionSchema = new Schema({
    farmer: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    item: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    type: {
        type: String,
        enum: ['sale', 'purchase'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});


const StockTransaction = mongoose.model('StockTransaction', stockTransactionSchema);

export default StockTransaction;
