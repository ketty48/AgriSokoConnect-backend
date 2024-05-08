import express from 'express';
const userRouter = express.Router();
import { SignUp, SignIn, ValidateOpt, ForgotPassword, ResetPassword,updateUser } from '../controllers/users.controller.js';
import { signUpValidations, signInValidations, otpValidation, forgotPasswordValidation, resetPasswordValidation } from '../utils/validation.js';
import { requireAuth } from '../middlewares/authorization.js';

userRouter.post('/signup', signUpValidations, SignUp);
userRouter.post('/signin', signInValidations, SignIn);
userRouter.post('/verify', otpValidation, ValidateOpt);
userRouter.post('/forgotPassword', forgotPasswordValidation, ForgotPassword)
userRouter.post('/resetPassword', resetPasswordValidation, ResetPassword);
userRouter.use(requireAuth);
userRouter.put('/update', updateUser)

export default userRouter;