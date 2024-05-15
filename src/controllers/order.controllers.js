import orderModel from "../models/order.model.js";
import userModel from "../models/users.model.js";
import asyncWrapper from "../middlewares/async.js";
import { NotFoundError, BadRequestError } from "../errors/index.js";
import { validationResult } from "express-validator";
import { sendEmail } from "../utils/sendEmail.js";
import stockModel from "../models/stock.model.js"; 

// Function to fetch product details based on product name
async function getProductDetails(productName) {
  try {
    const stockItem = await stockModel.findOne({ NameOfProduct: productName });

    if (!stockItem) {
      return null;
    }

    return {
      Description: stockItem.Description,
      pricePerTon: stockItem.pricePerTon,
    };
  } catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
  }
}

export const addOrder = asyncWrapper(async (req, res, next) => {
  try {
    const requiredFields = ['selectedStockItems', 'phoneNumber', 'shippingAddress'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      throw new BadRequestError(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      throw new BadRequestError(errorMessages.join(', '));
    }

    const { selectedStockItems, phoneNumber, shippingAddress } = req.body;
    const customer = req.user._id;

    const user = await userModel.findById(customer);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    let totalAmount = 0;

    const updatedStockItems = await Promise.all(selectedStockItems.map(async (item) => {
      const productDetails = await getProductDetails(item.NameOfProduct);
      if (!productDetails) {
        throw new NotFoundError(`Product details not found for product: ${item.NameOfProduct}`);
      }
      const itemTotalPrice = item.quantity * productDetails.pricePerTon;
      totalAmount += itemTotalPrice;

      return {
        ...item,
        Description: productDetails.Description,
        pricePerTon: productDetails.pricePerTon,
        itemTotalPrice
      };
    }));

    const newOrder = new orderModel({
      customer,
      selectedStockItems: updatedStockItems,
      phoneNumber,
      shippingAddress,
      totalAmount,
      totalItems: selectedStockItems.reduce((total, item) => total + item.quantity, 0),
    });

    await newOrder.save();

    const recipientEmail = user.email;
    const subject = 'Your order has been received';
    const body = `Dear ${user.email},

Your order has been received successfully.

Here are the details of your order:

${updatedStockItems.map((item, index) => `
Item ${index + 1}:
Name: ${item.NameOfProduct}
Description: ${item.Description}
Quantity: ${item.quantity}
Unit Price: ${item.pricePerTon}
Total Price: ${item.itemTotalPrice}
`).join('\n')}

Total Amount: ${totalAmount}
Total Items: ${newOrder.totalItems}
Shipping Address:
${shippingAddress}

Total Amount to be Paid: ${totalAmount}

Thank you for your order!

Sincerely,
Agriconnect`;

    await sendEmail(recipientEmail, subject, body);

    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    next(error);
  }
});

export const getAllOrders = asyncWrapper(async (req, res, next) => {
  try {
    const orders = await orderModel.find();
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

export const getOrder = asyncWrapper(async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});
export const updateOrder = asyncWrapper(async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }
    
    // Fetch the user based on order.customer
    const user = await userModel.findById(order.customer);

    const { selectedStockItems, shippingAddress } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      throw new BadRequestError(errorMessages.join(', '));
    }

    const validStockItems = await Promise.all(
      selectedStockItems.map(async (stockItem) => {
        const stock = await stockModel.findOne({ NameOfProduct: stockItem.NameOfProduct });
        if (!stock) {
          console.warn(`Stock item with NameOfProduct "${stockItem.NameOfProduct}" not found`);
          return null;
        }
        return stock;
      })
    );

    const allStockItemsFound = validStockItems.every((stock) => stock !== null);
    if (!allStockItemsFound) {
      throw new BadRequestError("One or more stock items not found");
    }

    let totalAmount = 0;
    const updatedStockItems = validStockItems.map((stock, index) => {
      const selectedItem = selectedStockItems[index];
      const itemTotalPrice = selectedItem.quantity * stock.pricePerTon;

      totalAmount += itemTotalPrice;

      return {
        NameOfProduct: selectedItem.NameOfProduct,
        quantity: selectedItem.quantity,
        itemTotalPrice,
      };
    });

    order.selectedStockItems = updatedStockItems;
    order.shippingAddress = shippingAddress;
    order.totalAmount = totalAmount;

    await order.save();

    const recipientEmail = user.email; // Corrected the recipient email address
    const subject = 'Your order has been updated';
    const body = `Dear ${user.email},


Here are the updated details of your order:

${updatedStockItems.map((item, index) => `
Item ${index + 1}:
Name: ${item.NameOfProduct}
Quantity: ${item.quantity}
Total Price: ${item.itemTotalPrice}
`).join('\n')}

Total Amount: ${totalAmount}
Shipping Address:
${shippingAddress}

Thank you for your order!

Sincerely,
Agriconnect`;

    await sendEmail(recipientEmail, subject, body);
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

export const deleteOrder = asyncWrapper(async (req, res, next) => {
  try {
    const orderId = req.params.id;

    const order = await orderModel.findByIdAndDelete(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    res
      .status(200)
      .json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    next(error);
  }
});
