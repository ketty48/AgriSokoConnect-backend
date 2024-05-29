import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import got from 'got';
import User from '../models/users.model.js';
import Profile from '../models/editProfile.model.js';
import Order from '../models/order.model.js'; // Import your order model

dotenv.config();

export const initiatePayment = async (req, res) => {
    try {
        const { email } = req.user;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const profile = await Profile.findOne({ user: user._id });
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found' });
        }

        // Create a new order
        const order = new Order({
            user: user._id,
            // Add other relevant order details
        });

        await order.save();

        const { PhoneNumber } = profile;
        const customerName = `${profile.fullName}`;

        const payload = {
            tx_ref: 'RX1-' + uuidv4(),
            amount: "100", // Adjust the amount as needed
            currency: "RWF",
            redirect_url: "https://agrisoko-connect-platform.netlify.app/",
            meta: {
                consumer_id: uuidv4(),
                consumer_mac: "92a3-912ba-1192a"
            },
            customer: {
                email,
                phone_number: PhoneNumber.toString(),
                name: customerName,
            },
            customizations: {
                title: "AgriSoKoConnect",
                logo: "http://www.piedpiper.com/app/themes/joystick-v27/images/logo.png"
            },
            configurations: {
                session_duration: 1, // Session timeout in minutes (maxValue: 1440 minutes)    
                max_retry_attempt: 5, // Max retry (int)
            }
        };

        console.log('Request Payload:', payload);

        const secretKey = process.env.SECRETE_KEY; // Ensure your .env file has SECRET_KEY

        if (!secretKey) {
            throw new Error('SECRET_KEY is not defined in the environment variables');
        }
        console.log('SECRET_KEY:', secretKey); 
        const response = await got.post("https://api.flutterwave.com/v3/payments", {
            headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/json'
            },
            json: payload,
            responseType: 'json'
        });

        console.log('Response:', response.body);

        // if (response && response.body && response.body.status === 'success') {
        //     // Update order status to "confirmed"
        //     await Order.updateOne({ _id: order._id }, { status: 'confirmed' });
            
        //     res.redirect(response.body.data.link); // Redirect the user to the payment link
        // } else {
        //     res.status(500).json({ error: 'Payment initiation failed' });
        // }
    } catch (err) {
        console.error('Error:', err);
        if (err.response) {
            console.error('Error Response:', err.response.body);
            res.status(err.response.statusCode).json({ error: err.response.body });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};
