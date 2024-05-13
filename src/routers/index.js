
import express from 'express';
import userRouter from './users.routers.js';
import tokenRouter from './authToken.routes.js';
import stockRouter from './stock.routes.js';
import profileRouter from './profile.routers.js';
import orderRouter from './order.routes.js';
const router = express.Router();


router.use('/user', userRouter);
router.use('/token', tokenRouter);
router.use('/stock',stockRouter)
router.use('/profile', profileRouter);
router.use('/order', orderRouter);

export default router;