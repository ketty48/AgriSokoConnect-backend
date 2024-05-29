import orderModel from "../models/order.model.js";
import userModel from "../models/users.model.js";
import asyncWrapper from "../middlewares/async.js";
import { NotFoundError, BadRequestError } from "../errors/index.js";
import { validationResult } from "express-validator";
import { sendEmail } from "../utils/sendEmail.js";
import stockModel from "../models/stock.model.js";

export const addOrder = asyncWrapper(async (req, res, next) => {
  try {
    const requiredFields = ["selectedStockItems", "phoneNumber", "shippingAddress"];
    
    const missingFields = requiredFields.filter((field) => !req.body[field]);
    if (missingFields.length > 0) {
      throw new BadRequestError(`Missing required fields: ${missingFields.join(", ")}`);
    }

    const { selectedStockItems, phoneNumber, shippingAddress } = req.body;
    console.log(selectedStockItems)
    const customer = req.user._id;
    const user = await userModel.findById(customer);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    let totalAmount = 0;
    const updatedStockItems = await Promise.all(selectedStockItems.map(async (item) => {
      const productName = item.NameOfProduct;
      const stockItem = await stockModel.findOne({ NameOfProduct: productName });
      if (!stockItem) {
        throw new NotFoundError(`Stock item not found: ${productName}`);
      }
      const typeOfProduct = stockItem.typeOfProduct;
      const itemTotalPrice = item.quantity * stockItem.pricePerTon;
      totalAmount += itemTotalPrice;
      return {
        _id: stockItem._id, // Use the ID of the found stock item
        NameOfProduct: stockItem.NameOfProduct,
        Description: stockItem.description,
        pricePerTon: stockItem.pricePerTon,
        quantity: item.quantity,
        typeOfProduct,
        itemTotalPrice
      };
    }));
    

    // The rest of your code remains unchanged...


    const newOrder = new orderModel({
      customer,
      selectedStockItems: updatedStockItems,
      phoneNumber,
      shippingAddress,
      totalAmount,
      totalItems: selectedStockItems.reduce(
        (total, item) => total + item.quantity,
        0
      ),
    });

    await newOrder.save();

    await Promise.all(
      updatedStockItems.map(async (item) => {
        const stock = await stockModel.findById(item._id);
        if (stock) {
          stock.quantity -= item.quantity;
          stock.totalPrice = stock.quantity * stock.pricePerTon; // Update total price
          await stock.save();
        }
      })
    );

    res.status(201).json({
      status: "Order placed successfully",
      data: {
        newOrder,
      },
    });

    const recipientEmail = user.email;
    const subject = "Order Placed";
    const body = `Dear ${user.email},\n\nYour order has been placed successfully. Total Amount: ${totalAmount}.\n\n`;

    try {
      await sendEmail(recipientEmail, subject, body);
      console.log("Notification email sent successfully");
    } catch (error) {
      console.error("Error sending notification email:", error);
    }
  } catch (error) {
    next(error);
  }
});


export const getAllOrders = asyncWrapper(async (req, res, next) => {
  try {
    const orders = await orderModel.find({ customer: req.user.id });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

export const getOrder = asyncWrapper(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const order = await orderModel.findOne({_id: orderId, customer: userId });
  
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
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the order by ID
    const order = await orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundError("Order not found");
    }

    // Fetch the user based on order.customer
    const user = await userModel.findById(order.customer);

    // Determine if the user has permission to update the order
    if (userRole === 'buyer' && order.customer.toString() !== userId.toString()) {
      throw new ForbiddenError("Buyers can only update their own orders");
    } else if (userRole === 'farmer') {
      const farmerStockItems = await stockModel.find({ user: userId });
      const productNames = farmerStockItems.map(stockItem => stockItem.NameOfProduct);
      const orderContainsFarmerStock = order.selectedStockItems.some(item => productNames.includes(item.NameOfProduct));
      if (!orderContainsFarmerStock) {
        throw new ForbiddenError("Farmers can only update orders related to their stock");
      }
    }

    // Extract update data from request
    const { selectedStockItems, shippingAddress,status } = req.body;

    // Initialize an update object
    const updateFields = {};

    if (selectedStockItems) {
      const validStockItems = await Promise.all(
        selectedStockItems.map(async (stockItem) => {
          const stock = await stockModel.findOne({
            NameOfProduct: stockItem.NameOfProduct,
          });
          if (!stock) {
            console.warn(
              `Stock item with NameOfProduct "${stockItem.NameOfProduct}" not found`
            );
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

      // Update selectedStockItems and totalAmount fields
      updateFields.selectedStockItems = updatedStockItems;
      updateFields.totalAmount = totalAmount;
    }

    if (shippingAddress) {
      // Update shippingAddress field
      updateFields.shippingAddress = shippingAddress;
    }
    if (status) {
      // Update shippingAddress field
      updateFields.status= status;
    }


    if (Object.keys(updateFields).length === 0) {
      throw new BadRequestError("No valid fields provided for update");
    }

    // Update the order with the new fields
    const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { $set: updateFields }, { new: true });

    // Send email notification
    const recipientEmail = user.email;
    const subject = "Your order has been updated";
    const body = `Dear ${user.email},

Here are the updated details of your order:

${selectedStockItems ? updatedStockItems.map(
    (item, index) => `
Item ${index + 1}:
Name: ${item.NameOfProduct}
Quantity: ${item.quantity}
Total Price: ${item.itemTotalPrice}
`
  ).join("\n") : ''}

Total Amount: ${updateFields.totalAmount || order.totalAmount}
Shipping Address:
${shippingAddress || order.shippingAddress}

Thank you for your order!

Sincerely,
Agriconnect`;

    await sendEmail(recipientEmail, subject, body);

    // Respond with the updated order
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
});

export const deleteOrder = asyncWrapper(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    console.log('orderId:', orderId); // Log orderId
    console.log('userId:', userId); // Log userId

    const order = await orderModel.findOneAndDelete({
      user: userId,
      _id: orderId
    });

    console.log('order:', order); // Log order

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
export const adminDeleteOrder = asyncWrapper(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    // const userId = req.user.id;

    console.log('orderId:', orderId); // Log orderId
    // console.log('userId:', userId); // Log userId

    const order = await orderModel.findByIdAndDelete({
      _id: orderId
    });

    console.log('order:', order); // Log order

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


