import Transaction from '../models/transaction.model.js'
// Import asyncWrapper
import asyncWrapper from "../middlewares/async.js";
import stock from '../models/stock.model.js'
import Farmer from '../models/users.model.js'


 export const createTransaction = asyncWrapper(async (req, res) => {
    const { stockId, quantity,date } = req.body;

    // Check if stock item exists
    const stockItem = await stock.findById(stockId);

    if (!stockItem) {
        return res.status(404).json({ message: 'Stock item not found' });
    }

    // Create a new transaction
    const transaction = new Transaction({
        stock: stockId,
        quantity,
        date,
      
    });

    await Transaction.save();

    res.status(201).json(transaction);
});

export const getAllTransactions = asyncWrapper(async (req, res) => {
    const transactions = await Transaction.find();
    res.json(transactions);
});

export const getAllFarmersWithStock = asyncWrapper(async (req, res) => {

    const farmers = await Farmer.find();

    // For each farmer, fetch their associated stock items
    const farmersWithStock = await Promise.all(farmers.map(async (farmer) => {
        const stockItems = await stock.find({ farmer: farmer._id });
        return {
            farmer: farmer.name,
            stock: stockItems
        };
    }));

    res.json(farmersWithStock);
});

