import express from 'express';
const userRouter = express.Router();
import {updateUser,getUserIfo } from '../controllers/profile.controller.js';
import { requireAuth } from '../middlewares/authorization.js';

userRouter.use(requireAuth);
userRouter.put('/update', updateUser)
userRouter.get('/info', getUserIfo)

export default userRouter;