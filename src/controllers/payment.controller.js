import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import Flutterwave from 'flutterwave-node-v3';
import User from '../models/users.model.js';
import Profile from '../models/editProfile.model.js';

dotenv.config();

const flw = new Flutterwave(process.env.PUBLIC_KEY, process.env.SECRETE_KEY);

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

        const { PhoneNumber } = profile;
        const paymentMethod = req.body.payment_method;

        const customerName = `${user.firstName || 'FirstName'} ${user.lastName || 'LastName'}`;

        const payload = {
            tx_ref: 'RX1-' + uuidv4(),
            order_id: uuidv4(),
            amount: 10,
            currency: 'RWF',
            country: 'RW',
            payment_options: paymentMethod === 'momo' ? 'mobilemoneyrwanda' : 'card',
            redirect_url: 'https://agrisoko-connect-platform.netlify.app',
            customer: {
                email,
                phone_number: PhoneNumber.toString(),
                name: customerName,
            },
            customizations: {
                title: 'Payment for your booking',
                description: 'Payment for your booking on AgriSoko Connect',
                logo: 'https://your-logo-url.com/logo.png',
            },
        };

        console.log('Request Payload:', payload);

        let response;
        if (paymentMethod === 'momo') {
            response = await flw.MobileMoney.rwanda(payload);
        } else {
            // For card payment
            const cardPayload = {
                ...payload,
                card_number: req.body.card_number,
                cvv: req.body.cvv,
                expiry_month: req.body.expiry_month,
                expiry_year: req.body.expiry_year,
                enckey: process.env.ENCRYPTION_KEY,
            };
            response = await flw.Charge.card(cardPayload);
        }

        console.log('Payment Response:', response);

        if (response && response.status === 'success') {
            if (paymentMethod === 'momo') {
                res.redirect(response.meta.authorization.redirect);
            } else {
                res.status(200).json(response);
            }
        } else {
            res.status(500).json({ error: 'Payment initiation failed', details: response });
        }
    } catch (error) {
        console.error('Payment initiation error:', error);
        res.status(500).json({ error: error.message });
    }
};
