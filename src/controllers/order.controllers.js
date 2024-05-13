import orderModel from "../models/order.model.js";
import asyncWrapper from "../middlewares/async.js";
import { NotFoundError, BadRequestError } from "../errors/index.js";
import { validationResult } from "express-validator";

export const addOrder = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }

  const { user, stock, quantity, quality, phoneNumber, Address } = req.body;
  const userId = req.user.id;

  const newOrder = new orderModel({
    user: userId, // Use userId here
    stock,
    quantity,
    quality,
    phoneNumber,
    Address,
  });

  await newOrder.save();

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
