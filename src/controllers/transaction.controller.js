import Transaction from '../models/transaction.model.js';
import asyncWrapper from "../middlewares/async.js";
import Stock from '../models/stock.model.js';
import User from '../models/users.model.js';
import Profile from '../models/editProfile.model.js'

export const createTransaction = asyncWrapper(async (req, res) => {
    const { stockId, quantity, date } = req.body;
    const userId = req.user.id; // Assuming you have user id in request object
    const user = await User.findById(userId);

    // Check if stock item exists
    const stockItem = await Stock.findById(stockId);

    if (!stockItem) {
        return res.status(404).json({ message: 'Stock item not found' });
    }

    // Create a new transaction
    const transaction = new Transaction({
        stock: stockId,
        quantity,
        date,
    });

    await transaction.save();

    res.status(201).json(transaction);
});

export const getAllTransactions = asyncWrapper(async (req, res) => {
    const transactions = await Transaction.find();
    res.json(transactions);
});

export const getAllFarmersWithStock = asyncWrapper(async (req, res) => {
    try {
        // console.log('Fetching users with roles...');
        const users = await User.find().populate('role').exec();
        // console.log('Fetched users:', users);

        // Filter users to get only farmers
        const farmers = users.filter(user => user.role && user.role.role === 'farmer');
     
        const profiles = await Profile.find({ user: { $in: farmers.map(farmer => farmer._id) } }).exec();
   

        // Retrieve stock items for each farmer by user ID
        const farmersWithStock = await Promise.all(profiles.map(async (profile) => {
           

            // Fetch stock items based on user ID
            const stockItems = await Stock.find({ user: profile.user }).exec();
           

            return { farmer: profile.fullName, stock: stockItems };
        }));

 
        res.json({ farmersWithStock });
    } catch (error) {
        console.error('Error fetching farmers with stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

