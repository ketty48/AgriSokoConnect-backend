import {initiatePayment } from '../controllers/payment.controller.js'
import express from 'express';
const app = express();
import {requireAuth} from '../middlewares/authorization.js'
app.use(requireAuth)
app.post('/momo',initiatePayment)
export default app