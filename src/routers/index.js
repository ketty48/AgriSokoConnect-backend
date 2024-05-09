
import express from 'express';
import userRouter from './users.routers.js';
import tokenRouter from './authToken.routes.js';
import profileRouter from './profile.routers.js';
const router = express.Router();


router.use('/user', userRouter);
router.use('/token', tokenRouter);
router.use('/profile', profileRouter);


export default router;