import Stock from "../models/stock.model.js";
import OrderModel from "../models/order.model.js";
import asyncWrapper from "../middlewares/async.js";
import { NotFoundError, BadRequestError } from "../errors/index.js";
import { validationResult } from "express-validator";
import userModel from "../models/users.model.js";
import { sendEmail } from "../utils/sendEmail.js";

export const getAllOrders = asyncWrapper(async (req, res) => {
    const farmerStock = await Stock.findOne({ user: req.user._id });
    if (!farmerStock) {
      return res.status(404).json({ message: 'Farmer stock not found' });
    }
  
    const orders = await OrderModel.find({  'selectedStockItems._id': farmerStock._id });
    res.json({ orders });
  });
  export const getOrder = asyncWrapper(async (req, res) => {
    // Log the order ID to verify it's correctly captured
    console.log('Order ID from URL:', req.params.orderId);

    const farmerStock = await Stock.findOne({ user: req.user._id });
    if (!farmerStock) {
        return res.status(404).json({ message: 'Farmer stock not found' });
    }

    const order = await OrderModel.findOne({ _id: req.params.id, 'selectedStockItems._id': farmerStock._id });
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
});

  