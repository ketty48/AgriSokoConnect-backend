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
dotenv.config();
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

export const addStock = [
  asyncWrapper(async (req, res, next) => {
    const userId=req.user.id;
    const { NameOfProduct, ...otherFields } = req.body;
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
      user:req.user.id,
      NameOfProduct,
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

    res.status(201).json({
      status: "Stock added successfully",
      data: {
        newStock,
      },
    });
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
  const body = `Dear ${user.email},\n\nThe stock item (${NameOfProduct}) has been updated successfully. New Quantity: ${quantity}, New Price: ${totalPrice}.\n\n`;

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
    const orders = await Order.find({ 'selectedStockItems.NameOfProduct': { $in: productNames } })
      .populate('customer', 'email')  // Populate user email initially

    const ordersWithProfiles = await Promise.all(orders.map(async order => {
      const profile = await Profile.findOne({ user: order.customer._id });
      return {
        ...order.toObject(),
        customer: {
          ...order.customer.toObject(),
          fullName: profile ? profile.fullName : null,
          phoneNumber: profile ? profile.PhoneNumber : null
        }
      };
    }));

    res.status(200).send(ordersWithProfiles);
  } catch (error) {
    console.error('Error retrieving orders for farmer:', error);
    res.status(500).send({ error: 'Error retrieving orders.' });
  }
};
