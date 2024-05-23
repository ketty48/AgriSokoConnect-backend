
import express from 'express';
import userRouter from './users.routers.js';
import tokenRouter from './authToken.routes.js';
import stockRouter from './stock.routes.js';
import profileRouter from './profile.routers.js';
import orderRouter from './order.routes.js';
import transactionRouter from './transaction.router.js'
import adminRouter from './admin.router.js'
import contactRouter from './contact.routes.js';
import payRouter from './payment.router.js'

const router = express.Router();


router.use('/user', userRouter);
router.use('/token', tokenRouter);
router.use('/stock',stockRouter)
router.use('/profile', profileRouter);
router.use('/order', orderRouter);
router.use('/transaction', transactionRouter)
router.use('/admin', adminRouter);
router.use('/pay', payRouter);
router.use('/contact', contactRouter);
export default router;