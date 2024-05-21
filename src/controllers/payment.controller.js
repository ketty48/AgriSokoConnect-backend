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

    const paymentOptions = req.body.payment_method === 'momo' ? 'mobilemoneyrwanda' : 'card';

    const payload = {
      tx_ref: 'RX1-' + uuidv4(),
      order_id: uuidv4(),
      amount: 10,
      currency: 'RWF',
      redirect_url: 'https://agrisoko-connect-platform.netlify.app',
      customer: {
        email,
        phonenumber: PhoneNumber.toString(),
      },
      customizations: {
        title: 'Payment for AgriSokoConnect',
        description: 'Payment for goods',
        logo: 'https://example.com/logo.png',
      },
    };

    console.log('Request Payload:', payload);

    let response;
    if (req.body.payment_method === 'momo') {
      response = await flw.MobileMoney.rwanda(payload);
    } else {
      // Include the encryption key in the payload for card payments
      payload.enckey = process.env.ENCRYPTION_KEY;

      response = await flw.Charge.card(payload);
    }

    if (response.status === 'success') {
      if (response.meta && response.meta.authorization && response.meta.authorization.redirect) {
        res.redirect(response.meta.authorization.redirect);
      } else {
        res.status(200).json(response);
      }
    } else {
      res.status(500).json({ error: 'Payment initiation failed' });
    }
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ error: error.message });
  }
};
