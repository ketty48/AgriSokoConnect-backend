import orderModel from "../models/order.model.js";
import asyncWrapper from "../middlewares/async.js";
import { NotFoundError, BadRequestError } from "../errors/index.js";
import { validationResult } from "express-validator";
import { sendEmail } from "../utils/sendEmail.js";
import userModel from "../models/users.model.js";
import stockModel from "../models/stock.model.js";
export const addOrder = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }

  const { stock, quantity, quality, phoneNumber, Address } = req.body;
  const userId = req.user.id;

  // Retrieve the stock details to calculate the total price
  const selectedStock = await stockModel.findById(stock);
  if (!selectedStock) {
    throw new NotFoundError("Selected stock not found");
  }

  // Calculate the total price based on the quantity ordered and the stock price
  const totalPrice = selectedStock.price * quantity;

  const newOrder = new orderModel({
    user: userId,
    stock,
    quantity,
    quality,
    phoneNumber,
    Address,
    totalPrice, // Add totalPrice to the order
  });

  await newOrder.save();

  const user = await userModel.findById(userId);
  if (!user || !user.email) {
    throw new NotFoundError("User not found or missing email");
  }

  const recipientEmail = user.email;
  const subject = "Order Received Notification";
  const body = `Dear ${user.userName},\n\nA new order (${selectedStock.NameOfProduct}) has been received successfully. Quantity: ${quantity}, Quality: ${quality}, Contact Number: ${phoneNumber}, Delivery Address: ${Address}. Total Price: ${totalPrice}.\n\n`;

  try {
    await sendEmail(recipientEmail, subject, body);
    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Error sending notification email:', error);
  }

  res.status(201).json({
    status: "Order added successfully",
    data: {
      newOrder,
    },
  });
});

export const getAllStock = asyncWrapper(async (req, res, next) => {
  try {
    let params = stockModel.find();
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy;
      params = params.sort({ [sortBy]: 1 });
    }
    if (req.query.category) {
      const category = req.query.category;
      params = params.sort({ [category]: 1 });
    }

    const stocks = await params;

    res.status(200).json({
      status: "All stock available",
      stocks: stocks,
    });
  } catch (error) {
    return next(error);
  }
});

export const getStockByID = asyncWrapper(async (req, res, next) => {
  const stockId = req.params.id;
  const userId = req.user.id;
  try {
    const stock = await stockModel.findOne({ _id: stockId, user: userId }).populate('user', 'name');
    if (!stock) {
      return next(new NotFoundError("Stock not found"));
    }
    res.status(200).json({
      status: "Stock found",
      stock: stock
    });
  } catch (error) {
    return next(error);
  }
});

export const updateStock = asyncWrapper(async (req, res, next) => {
  const stockId = req.params.id;
  const userId = req.user.id;
  try {
    const stock = await stockModel.findOne({ _id: stockId, user: userId });
    if (!stock) {
      return next(new NotFoundError("Stock not found"));
    }
    const updatedStock = await stockModel.findByIdAndUpdate(stockId, req.body, { new: true });

  
    const user = await userModel.findById(userId);
    if (!user || !user.email) {
      throw new NotFoundError("User not found or missing email");
    }
    const recipientEmail = user.email;
    const subject = "Stock Updated Notification";
    const body = `Dear ${user.userName},\n\nThe stock item (${updatedStock.NameOfProduct}) has been updated successfully. New Quantity: ${updatedStock.quantity}, New Price: ${updatedStock.totalPrice}.\n\n`;
    try {
      await sendEmail(recipientEmail, subject, body);
      console.log('Notification email sent successfully');
    } catch (error) {
      console.error('Error sending notification email:', error);
    }

    res.status(200).json({
      status: "Stock updated",
      stock: updatedStock
    });
  } catch (error) {
    return next(error);
  }
});

export const deleteStock = asyncWrapper(async (req, res, next) => {
  const stockId = req.params.id;
  const userId = req.user.id;
  try {
    const stock = await stockModel.findOne({ _id: stockId, user: userId });
    if (!stock) {
      return next(new NotFoundError("Stock not found"));
    }
    await stockModel.findByIdAndDelete(stockId);
    res.status(200).json({
      status: "Stock deleted"
    });
  } catch (error) {
    return next(error);
  }
});
