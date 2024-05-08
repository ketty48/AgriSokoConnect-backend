
import express from 'express';
import userRouter from './users.routers.js';
import tokenRouter from './authToken.routes.js';
const router = express.Router();


router.use('/user', userRouter);
router.use('/token', tokenRouter);


export default router;