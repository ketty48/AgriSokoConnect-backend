import express from 'express';
import dotenv from 'dotenv'
dotenv.config()
const userRouter = express.Router();
import { SignUp, SignIn, ValidateOpt, ForgotPassword, ResetPassword} from '../controllers/users.controller.js';
import { signUpValidations, signInValidations, otpValidation, forgotPasswordValidation, resetPasswordValidation } from '../utils/validation.js';
import configuration from '../configs/index.js'
import { getRoles,addRole} from '../controllers/role.contoller.js';
import cors from 'cors'
import session from 'express-session'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import passport from 'passport'
userRouter.get('/role',getRoles)
userRouter.post('/add',addRole)
userRouter.post('/signup', signUpValidations, SignUp);
userRouter.post('/signin', signInValidations, SignIn);
userRouter.post('/verify', otpValidation, ValidateOpt);
userRouter.post('/forgotPassword', forgotPasswordValidation, ForgotPassword)
userRouter.post('/resetPassword', resetPasswordValidation, ResetPassword);

export default userRouter;