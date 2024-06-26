import stockModel from "../models/stock.model.js";
import asyncWrapper from "../middlewares/async.js";
import { NotFoundError, BadRequestError } from "../errors/index.js";
import { validationResult } from "express-validator";
import userModel from "../models/users.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import cloudinary from "cloudinary";
import dotenv from "dotenv";
import Order from '../models/order.model.js'
import Profile from '../models/editProfile.model.js'
import mongoose from "mongoose";
dotenv.config();
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});
export const addStock = [
  asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;
    console.log("Request body:", req.body);
    const { NameOfProduct, description, ...otherFields } = req.body;
    console.log("Description:", description); // This should now correctly log the description
    if (!req.files || !("image" in req.files)) {
      return res.json({ message: "err" });
    }
    const dateNow = Date.now();
    const Photo = `${NameOfProduct}_Photo_${dateNow}`;
    const profileP = await cloudinary.v2.uploader.upload(
      req.files.image[0].path,
      {
        folder: "uploads",
        public_id: Photo,
      }
    );

    const newStock = new stockModel({
      user: req.user.id,
      NameOfProduct,
      description, // This should now correctly add the description to the new stock
      image: profileP.secure_url,
      ...otherFields,
    });

    await newStock.save();

    const user = await userModel.findById(userId);
    const recipientEmail = user.email;
    const subject = "Stock Added";
    const body = `Dear ${user.email},\n\nA new stock item (${newStock.NameOfProduct}) has been added successfully. Description: ${newStock.description}, Quantity: ${newStock.quantity}, Price per Ton: ${newStock.pricePerTon}, Total Price: ${newStock.totalPrice}.\n\n`;

    try {
      await sendEmail(recipientEmail, subject, body);
      console.log("Notification email sent successfully");
    } catch (error) {
      console.error("Error sending notification email:", error);
    }

    const responseData = {
      status: "Stock added successfully",
      data: {
        newStock: {
          ...newStock.toJSON(),
          totalPrice: newStock.totalPrice,
        },
      },
    };

    res.status(201).json(responseData);
  }),
];


export const getStock = asyncWrapper(async (req, res, next) => {
  try {
    let query = stockModel.find({ user: req.user.id });


    if (req.query.sortBy) {
      const sortBy = req.query.sortBy;
      query = query.sort({ [sortBy]: 1 });
    }
    if (req.query.category) {
      const category = req.query.category;
      query = query.find({ category });
    }

    const stocks = await query.exec();

    res.status(200).json({
      status: "All stock available",
      data: stocks,
    });
  } catch (error) {
    next(error);
  }
});
export const getStocks = asyncWrapper(async (req, res, next) => {
  try {
    let query = stockModel.find();

    // Sort stocks if sortBy parameter is provided
    if (req.query.sortBy) {
      const sortBy = req.query.sortBy;
      query = query.sort({ [sortBy]: 1 });
    }
    if (req.query.category) {
      const category = req.query.category;
      // console.log('Filtering by category:', category);
      query = query.find({ category });
    }

    const stocks = await query.exec();
    // console.log('Query:', query);
    // console.log('Retrieved stocks:', stocks);
    res.status(200).json({
      status: "All stock available",
      data: stocks,
    });
  } catch (error) {
   
    next(error);
  }
});
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const getStockByID = asyncWrapper(async (req, res, next) => {
  const stockId = req.params.id;
  const userId = req.user.id;

  // Validate stockId and userId
  if (!isValidObjectId(stockId)) {
    return next(new BadRequestError("Invalid stock ID"));
  }
  if (!isValidObjectId(userId)) {
    return next(new BadRequestError("Invalid user ID"));
  }

  try {
    const stock = await stockModel
      .findOne({ _id: stockId, user: userId })
      .populate('user', 'name');

    if (!stock) {
      return next(new NotFoundError("Stock not found"));
    }

    res.status(200).json({
      status: "success",
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
    return next(new BadRequestError(errors.array()[0].msg));
  }

  const { NameOfProduct, Description, pricePerTon, quantity } = req.body;
  const userId = req.user.id;

  const updateFields = {};
  if (NameOfProduct !== undefined) updateFields.NameOfProduct = NameOfProduct;
  if (Description !== undefined) updateFields.Description = Description;
  if (pricePerTon !== undefined) updateFields.pricePerTon = pricePerTon;
  if (quantity !== undefined) updateFields.quantity = quantity;

  if (quantity !== undefined && pricePerTon !== undefined) {
    updateFields.totalPrice = quantity * pricePerTon;
  }

  const updatedStock = await stockModel.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    { $set: updateFields },
    { new: true }
  );

  if (!updatedStock) {
    return next(new NotFoundError("Stock not found"));
  }

  const user = await userModel.findById(userId);
  if (!user) {
    return next(new NotFoundError("User not found"));
  }

  const recipientEmail = user.email;
  const subject = "Stock Updated Notification";
  let body = `Dear ${user.email},\n\nThe stock item (${NameOfProduct || 'N/A'}) has been updated successfully.`;
  if (quantity !== undefined) body += ` New Quantity: ${quantity}.`;
  if (updateFields.totalPrice !== undefined) body += ` New Price: ${updateFields.totalPrice}.`;
  body += `\n\n`;

  try {
    await sendEmail(recipientEmail, subject, body);
    console.log("Notification email sent successfully");
  } catch (error) {
    console.error("Error sending notification email:", error);
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
  });
});
export const getOrdersByFarmerId = async (req, res) => {
  try {
    const userId = req.user.id;
    const farmerStockItems = await stockModel.find({ user: userId });
    const productNames = farmerStockItems.map(stockItem => stockItem.NameOfProduct);
    const orders = await Order.find({ 'selectedStockItems.NameOfProduct': { $in: productNames },status: 'pending' })
      .populate('customer', 'email')  // Populate user email initially

    const ordersWithProfiles = await Promise.all(orders.map(async order => {
      const profile = await Profile.findOne({ user: order.customer._id });
      return {
        ...order.toObject(),
        customer: {
          ...order.customer.toObject(),
          fullName: profile ? profile.fullName : null,
        }
      };
    }));

    res.status(200).send(ordersWithProfiles);
  } catch (error) {
    console.error('Error retrieving orders for farmer:', error);
    res.status(500).send({ error: 'Error retrieving orders.' });
  }
};
export const getConfirmedOrdersByFarmerId = async (req, res) => {
  try {
    const userId = req.user.id;
    const farmerStockItems = await stockModel.find({ user: userId });
    const productNames = farmerStockItems.map(stockItem => stockItem.NameOfProduct);
    
    const confirmedOrders = await Order.find({ 
      'selectedStockItems.NameOfProduct': { $in: productNames },
      status: 'confirmed'
    }).populate('customer', 'email'); // Populate user email initially

    const ordersWithProfiles = await Promise.all(confirmedOrders.map(async order => {
      const profile = await Profile.findOne({ user: order.customer._id });
      return {
        ...order.toObject(),
        customer: {
          ...order.customer.toObject(),
          fullName: profile ? profile.fullName : null,
        }
      };
    }));

    res.status(200).send(ordersWithProfiles);
  } catch (error) {
    console.error('Error retrieving confirmed orders for farmer:', error);
    res.status(500).send({ error: 'Error retrieving confirmed orders.' });
  }
};