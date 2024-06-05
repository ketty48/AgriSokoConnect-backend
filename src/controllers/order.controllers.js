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
    const updatedStockItems = [];
    for (const item of selectedStockItems) {
      const productName = item.NameOfProduct;
      const requestedQuantity = item.quantity;
      const stockItem = await stockModel.findOne({ NameOfProduct: productName });
      console.log("Debugging: stockItem =", stockItem); // Add this line for debugging
      if (!stockItem) {
        throw new NotFoundError(`Stock item not found: ${productName}`);
      }
      const typeOfProduct = stockItem.typeOfProduct;
      const availableQuantity = stockItem.quantity;
      if (requestedQuantity > availableQuantity) {
        throw new BadRequestError(`Requested quantity for ${productName} is greater than available stock`);
      }
      const itemTotalPrice = requestedQuantity * stockItem.pricePerTon;
      totalAmount += itemTotalPrice;
      updatedStockItems.push({
        _id: stockItem._id, // Use the ID of the found stock item
        NameOfProduct: stockItem.NameOfProduct,
        Description: stockItem.description,
        pricePerTon: stockItem.pricePerTon,
        quantity: requestedQuantity,
        typeOfProduct,
        itemTotalPrice
      });
    }

    const newOrder = new orderModel({
      customer,
      selectedStockItems: updatedStockItems,
      phoneNumber,
      shippingAddress,
      totalAmount,
      totalItems: selectedStockItems.reduce((total, item) => total + item.quantity, 0),
    });

    await newOrder.save();

    await Promise.all(updatedStockItems.map(async (item) => {
      const stock = await stockModel.findById(item._id);
      if (stock) {
        stock.quantity -= item.quantity;
        stock.totalPrice = stock.quantity * stock.pricePerTon; // Update total price
        await stock.save();
      }
    }));

    res.status(201).json({
      status: "Order placed successfully",
      data: { newOrder },
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
      // Check if the order contains stock related to the farmer
      const farmerStockItems = await stockModel.find({ user: userId });
      const productNames = farmerStockItems.map(stockItem => stockItem.NameOfProduct);
      const orderContainsFarmerStock = order.selectedStockItems.some(item => productNames.includes(item.NameOfProduct));
      if (!orderContainsFarmerStock) {
        throw new ForbiddenError("Farmers can only update orders related to their stock");
      }
    }

    // Extract update data from request
    const { selectedStockItems, shippingAddress, status, phoneNumber } = req.body;

    const updateFields = {};

    if (selectedStockItems) {
      const updatedStockItems = [];
      let totalAmount = 0;
      let totalItems = 0;
    
      for (const selectedItem of selectedStockItems) {
        const orderItem = order.selectedStockItems.find(item => item.NameOfProduct === selectedItem.NameOfProduct);
        if (!orderItem) {
          throw new BadRequestError(`Order does not contain item "${selectedItem.NameOfProduct}"`);
        }
    
        const oldQuantity = orderItem.quantity;
        const newQuantity = selectedItem.quantity;
        const quantityDifference = newQuantity - oldQuantity;
    
        // Update the stock quantity accordingly
        await updateStock(selectedItem.NameOfProduct, -quantityDifference); // Decrement stock for the ordered item
    
        // Calculate the item total price based on the new quantity
        const stockItem = await stockModel.findOne({ NameOfProduct: selectedItem.NameOfProduct });
        if (!stockItem) {
          throw new NotFoundError(`Stock item "${selectedItem.NameOfProduct}" not found`);
        }
        const itemTotalPrice = stockItem.pricePerTon * newQuantity;
        
        totalAmount += itemTotalPrice; // Accumulate the total amount
        totalItems += newQuantity; // Accumulate the total items
    
        updatedStockItems.push({
          ...selectedItem,
          itemTotalPrice
        });
      }
    
      // Update selectedStockItems and totalAmount/totalItems in updateFields
      updateFields.selectedStockItems = updatedStockItems;
      updateFields.totalAmount = totalAmount;
      updateFields.totalItems = totalItems;

      // Retain typeOfProduct in updatedStockItems
      updateFields.typeOfProduct = updatedStockItems.map(item => item.typeOfProduct);
    }
    

    // Update other fields if provided
    if (shippingAddress) {
      updateFields.shippingAddress = shippingAddress;
    }
    if (status) {
      updateFields.status = status;
    }
    if (phoneNumber) {
      updateFields.phoneNumber = phoneNumber;
    }

    // Update the order with the new fields
    const updatedOrder = await orderModel.findByIdAndUpdate(orderId, { $set: updateFields }, { new: true });


    // Send email notification
    const recipientEmail = user.email;
    const subject = "Your order has been updated";
    const body = `Dear ${user.email},

Here are the updated details of your order:
${updateFields.selectedStockItems ? updateFields.selectedStockItems.map(
    (item, index) => `
Item ${index + 1}:
Name: ${item.NameOfProduct}
Quantity: ${item.quantity}
Price per Ton: ${item.pricePerTon}
Total Price: ${item.itemTotalPrice.toFixed(2)}
`
  ).join("\n") : ''}

Total Amount: ${updateFields.totalAmount?.toFixed(2) || order.totalAmount}
Total Items: ${updateFields.totalItems || order.totalItems}
Shipping Address:
${shippingAddress || order.shippingAddress}

Thank you for your order!

Sincerely,
Agriconnect`;

    await sendEmail(recipientEmail, subject, body);

    // Respond with the updated order
    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("Error updating order:", error); // Log the error for debugging
    next(error);
  }
});


const updateStock = async (itemName, quantityDifference) => {
  // Find the stock item by name
  const stockItem = await stockModel.findOne({ NameOfProduct: itemName });

  if (!stockItem) {
    throw new NotFoundError(`Stock item "${itemName}" not found`);
  }

  // Increment or decrement the stock quantity based on the quantity difference
  const newQuantity = stockItem.quantity + quantityDifference;

  // Ensure the stock quantity doesn't go negative
  if (newQuantity < 0) {
    throw new BadRequestError(`Insufficient stock for item "${itemName}"`);
  }

  // Calculate the new item total price
  const newItemTotalPrice = newQuantity * stockItem.pricePerTon;

  // Update the stock quantity and total price
  await stockModel.findOneAndUpdate(
    { NameOfProduct: itemName },
    { $set: { quantity: newQuantity, totalPrice: newItemTotalPrice } }
  );

  return { newQuantity, newItemTotalPrice };
};


export const deleteOrder = asyncWrapper(async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    console.log('orderId:', orderId); // Log orderId
    console.log('userId:', userId); // Log userId

    const order = await orderModel.findOneAndDelete({
      customer: userId,
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


