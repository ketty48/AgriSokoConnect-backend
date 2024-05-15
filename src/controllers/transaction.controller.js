import Transaction from '../models/transaction.model.js';
import asyncWrapper from "../middlewares/async.js";
import Stock from '../models/stock.model.js';
import User from '../models/users.model.js';
import Profile from '../models/editProfile.model.js'

export const createTransaction = asyncWrapper(async (req, res) => {
    const { stockId, quantity, date } = req.body;
    const userId = req.user.id; // Assuming you have user id in request object
    const user = await User.findById(userId);

    // Check if user has the role of "government"
    if (user.role !== 'government') {
        return res.status(403).json({ message: 'Access denied. Only government role can create a transaction.' });
    }

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
        console.log('Fetching users with roles...');
        const users = await User.find().populate('role').exec();
        console.log('Fetched users:', users);

        // Filter users to get only farmers
        const farmers = users.filter(user => user.role && user.role.role === 'farmer');
        console.log('Filtered farmers:', farmers);

        // Fetch profiles for farmers
        console.log('Fetching profiles...');
        const profiles = await Profile.find({ user: { $in: farmers.map(farmer => farmer._id) } }).exec();
        console.log('Fetched profiles:', profiles);

        // Retrieve stock items for each farmer by user ID
        const farmersWithStock = await Promise.all(profiles.map(async (profile) => {
            console.log('Profile Data:', profile);
            console.log('Processing farmer:', profile.fullName);

            // Fetch stock items based on user ID
            const stockItems = await Stock.find({ user: profile.user }).exec();
            console.log('Stock items for farmer', profile.fullName + ':', stockItems);

            return { farmer: profile.fullName, stock: stockItems };
        }));

        console.log('Farmers with stock:', farmersWithStock);
        res.json({ farmersWithStock });
    } catch (error) {
        console.error('Error fetching farmers with stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

