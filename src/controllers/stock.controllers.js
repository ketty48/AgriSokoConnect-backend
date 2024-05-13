import stockModel from "../models/stock.model.js";
import asyncWrapper from "../middlewares/async.js";
import { NotFoundError, BadRequestError } from "../errors/index.js";
import { validationResult } from "express-validator";
import userModel from "../models/users.model.js";
import { sendEmail } from "../utils/sendEmail.js";

export const addStock = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }

  const { NameOfProduct, Description, pricePerTon, quantity } = req.body;
  const userId = req.user.id;
  const totalPrice = pricePerTon * quantity;
  const newStock = new stockModel({
    NameOfProduct,
    Description,
    pricePerTon,
    quantity,
    totalPrice,
    user: userId,
  });
  await newStock.save();

  const user = await userModel.findById(userId);
  const recipientEmail = user.email;
  const subject = "Stock Added ";
  const body = `Dear ${user.userName},\n\nA new stock item (${newStock.NameOfProduct}) has been added successfully. Quantity: ${newStock.quantity}, Price per Ton: ${newStock.pricePerTon}, Total Price: ${newStock.totalPrice}.\n\n`;

  try {
    await sendEmail(recipientEmail, subject, body);
    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Error sending notification email:', error);
  }

  res.status(201).json({
    status: "Stock added successfully",
    data: {
      newStock,
    },
  });
});

export const getStock = asyncWrapper(async (req, res, next) => {
  let params = stockModel.find();
  if (req.params.sortBy) {
    const sortBy = req.params.sortBy;
    params = params.sort({ [sortBy]: 1 });
  }
  if (req.params.category) {
    const category = req.params.category;
    params = params.sort({ [category]: 1 });
  }
  const stocks = await params;
  res.status(200).json({
    status: "All stock available",
    stocks,
  });
});

export const getStockByID = asyncWrapper(async (req, res, next) => {
  const stockId = req.params.id;
  const userId = req.user.id;
  try {
    const stock = await stockModel
      .findOne({ _id: stockId, user: userId })
      .populate("user", "name");
    if (!stock) {
      return next(new NotFoundError("Stock not found"));
    }
    res.status(200).json({
      status: "Stock found",
      data: {
        stock,
      },
    });
  } catch (error) {
    return next(error);
  }
});

export const updateStock = asyncWrapper(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new BadRequestError(errors.array()[0].msg);
  }

  const { NameOfProduct, Description, pricePerTon, quantity } = req.body;
  const userId = req.user.id;
  const totalPrice = pricePerTon * quantity;

  const updatedStock = await stockModel.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    {
      NameOfProduct,
      Description,
      pricePerTon,
      quantity,
      totalPrice,
    },
    { new: true }
  );

  if (!updatedStock) {
    throw new NotFoundError("Stock not found");
  }

  const user = await userModel.findById(userId);
  if (!user || !user.userName) {
    throw new NotFoundError("User not found or missing username");
  }

  const recipientEmail = user.email;
  const subject = "Stock Updated Notification";
  const body = `Dear ${user.userName},\n\nThe stock item (${NameOfProduct}) has been updated successfully. New Quantity: ${quantity}, New Price: ${totalPrice}.\n\n`;

  try {
    await sendEmail(recipientEmail, subject, body);
    console.log('Notification email sent successfully');
  } catch (error) {
    console.error('Error sending notification email:', error);
  }

  res.status(200).json({
    status: "Stock updated successfully",
    data: {
      stock: updatedStock,
    },
  });
});

export const deleteStock = asyncWrapper(async (req, res, next) => {
  const stock = await stockModel.findById(req.params.id);
  if (!stock) {
    throw new NotFoundError("Stock not found");
  }
  await stockModel.findByIdAndDelete(req.params.id);
  res.status(200).json({
    status: "Stock deleted successfully",
    data: {
      stock,
    },
  });
});
