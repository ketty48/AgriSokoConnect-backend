import User from '../models/users.model.js';
import Profile from '../models/editProfile.model.js';
import Stock from '../models/stock.model.js';
import Order from '../models/order.model.js';
import Role from '../models/role.model.js';

// Get all farmers with their stock
export const getAllFarmersWithStock = async (req, res) => {
    try {
        const users = await User.find().populate('role').exec();
        // console.log('Fetched users:', users);

        // Filter users to get only farmers
        const farmers = users.filter(user => user.role && user.role.role === 'farmer');
     
        const profiles = await Profile.find({ user: { $in: farmers.map(farmer => farmer._id) } }).exec();
   

        // Retrieve stock items for each farmer by user ID
        const farmersWithStock = await Promise.all(profiles.map(async (profile) => {
           

            // Fetch stock items based on user ID
            const stockItems = await Stock.find({ user: profile.user }).exec();
           

            return { farmer: profile.fullName, stock: stockItems };
        }));

 
        res.json({ farmersWithStock });
    } catch (error) {
        console.error('Error fetching farmers with stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAllBuyersWithOrders = async (req, res) => {
    try {

        const users = await User.find().populate('role').exec();
        const buyers = users.filter(user => user.role && user.role.role === 'buyer');
     
        const profiles = await Profile.find({ user: { $in: buyers.map(buyer => buyer._id) } }).exec();
       

        const buyersWithOrder = await Promise.all(profiles.map(async (profile) => {
            const orderItems = await Order.find({ customer: profile.user }).exec();
          

            return { buyer: profile.fullName, orders: orderItems };
        }));
       
        res.json({ buyersWithOrder });
    } catch (error) {
        console.error('Error fetching buyers with orders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}


// Remove a user's profile
export const removeUserProfile = async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await User.findById(userId);
        if (user) {
            await user.remove();
            res.status(200).json({ message: 'User and associated profile removed successfully.' });
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

