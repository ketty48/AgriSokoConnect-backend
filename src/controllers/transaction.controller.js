
import asyncWrapper from "../middlewares/async.js";
import Stock from '../models/stock.model.js';
import User from '../models/users.model.js';
import Profile from '../models/editProfile.model.js'

import TransactionAndTax from '../models/transaction.model.js';
import { calculateTransactionAmount, calculateTaxAmount } from '../utils/transaction.js';

const calculateTransactionAndTax = async function(next) {
    if (this.isModified('quantity')) {
  
        const transactionAmount = calculateTransactionAmount(this.quantity, this.pricePerTon);
        const taxAmount = calculateTaxAmount(transactionAmount);
        const transaction = await TransactionAndTax.create({ user: this.user, type: 'Transaction', amount: transactionAmount });
        const tax = await TransactionAndTax.create({ user: this.user, type: 'Tax', amount: taxAmount });
        next();
    } else {
        next();
    }
};

// Attach middleware to the schema
Stock.schema.pre('save', calculateTransactionAndTax);


export const getAllFarmersWithStock = asyncWrapper(async (req, res) => {
    try {
   
        const users = await User.find().populate('role').exec();
        const farmers = users.filter(user => user.role && user.role.role === 'farmer');
     
        const profiles = await Profile.find({ user: { $in: farmers.map(farmer => farmer._id) } }).exec();

        const farmersWithStock = await Promise.all(profiles.map(async (profile) => {

            const stockItems = await Stock.find({ user: profile.user }).exec();
           

            return { farmer: profile.fullName, stock: stockItems };
        }));

 
        res.json({ farmersWithStock });
    } catch (error) {
        console.error('Error fetching farmers with stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export const getAllTransactions = asyncWrapper(async (req, res) => {
    const transactions = await TransactionAndTax.find({ type: 'Transaction' }).populate('users', 'email');
    res.status(200).json({ transactions });
});
export const getAllTaxes = asyncWrapper(async (req, res) => {
    const taxes = await TransactionAndTax.find({ type: 'Tax' }).populate('users', 'email');
    res.status(200).json({ taxes });
});