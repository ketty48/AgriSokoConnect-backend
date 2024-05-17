import fetch from 'node-fetch';
import dotenv from 'dotenv';
import express from 'express';
import Flutterwave from 'flutterwave-node-v3';
import open from 'open';

dotenv.config();

const app = express();

const PUBLIC_KEY = process.env.PUBLIC_KEY;
const SECRET_KEY = process.env.SECRETE_KEY;

console.log(`PUBLIC_KEY: ${PUBLIC_KEY}`); // Add logging
console.log(`SECRET_KEY: ${SECRET_KEY}`); // Add logging

if (!PUBLIC_KEY || !SECRET_KEY) {
  throw new Error('PUBLIC_KEY and SECRET_KEY must be set in the .env file');
}

const flw = new Flutterwave(PUBLIC_KEY, SECRET_KEY);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post('/momo', async (req, res) => {
  try {
    const { email, phone_number, name } = req.body;

    // Validate the required fields
    if (!email || !phone_number || !name) {
      return res.status(400).json({ error: 'Email, phone number, and name are required' });
    }

    console.log('Request body:', req.body); // Log the request body to ensure fields are present

    const tx_ref = `RX1-${Date.now()}`; // Generate a unique transaction reference

    const payload = {
      tx_ref: tx_ref,
      amount: 10,
      currency: "RWF",
      payment_type: "mobilemoneyrwanda", // Correct payment type
      redirect_url: "https://agrisoko-connect-platform.netlify.app",
      customer: {
        email: email, // dynamically receive from request body
        phone_number: phone_number, // dynamically receive from request body
        name: name // dynamically receive from request body
      },
      customizations: {
        title: "Beyond Beautiful",
        description: "Payment for your booking",
        logo: "img/favicon-32x32.png"
      }
    };

    console.log('Payload:', payload); // Log the payload to ensure it's correct

    // Ensure you use the correct method from the SDK
    const response = await flw.MobileMoney.rwanda(payload);

    console.log('Response:', response); // Log the response from the Flutterwave API

    if (response.status === 'success') {
      res.json({ link: response.data.link });
      // Optionally open the link automatically
      open(response.data.link);
    } else {
      res.status(400).json({ error: response.message });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



export default app;
