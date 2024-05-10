import UserModel from "../models/users.model.js";
import asyncWrapper from "../middlewares/async.js";
import bcryptjs from 'bcryptjs';
import { BadRequestError } from "../errors/index.js";
import { validationResult } from "express-validator";
import { sendEmail } from "../utils/sendEmail.js";
import { otpGenerator } from "../utils/otp.js";
import { UnauthorizedError } from "../errors/UnauthorizedError.js";
import jwt from "jsonwebtoken";
import Token from "../models/authToken.model.js";
import configuration from '../configs/index.js'
import sendTokenCookie from "../middlewares/cookie.js";
import profileModel from "../models/editProfile.model.js"
import RoleModel from "../models/role.model.js";



export const SignUp = asyncWrapper(async (req, res, next) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new BadRequestError(errors.array()[0].msg));
    }

    // Check if password and confirm password match
    if (req.body.password !== req.body.confirmPassword) {
        return next(new BadRequestError("Password and confirm password do not match"));
    }

    // Checking if the user is already using the email
    const foundUser = await UserModel.findOne({ email: req.body.email });
    if (foundUser) {
        return next(new BadRequestError("Email already in use"));
    }

    // Find role by name
    const role = await RoleModel.findOne({ name: req.body.role });

    // If role not found, handle error
    if (!role) {
        return next(new BadRequestError("Invalid role selected"));
    }

    // Hashing the user password
    const hashedPassword = await bcryptjs.hashSync(req.body.password, 10);

    // Generating OTP
    const otp = otpGenerator();
    const otpExpirationDate = new Date().getTime() + (60 * 1000 * 5);

    // Create a new user in UserModel
    const newUser = new UserModel({
        email: req.body.email,
        userName: req.body.userName,
        password: hashedPassword,
        role: role._id, // Save role ID instead of role name
        otp: otp,
        otpExpires: otpExpirationDate,
    });

    // Save user to database
    const savedUser = await newUser.save();

    if (!savedUser) {
        return next(new InternalServerError("User registration failed"));
    }

    // Create a new profile for the user
    const newProfile = new profileModel({
        user: savedUser._id,
        fullName: req.body.fullName,
        email: savedUser.email,
        address1: req.body.address1,
        PhoneNumber: req.body.PhoneNumber,
   
    });

    const savedProfile = await newProfile.save();

    if (!savedProfile) {
        // If profile creation fails, you might want to delete the user created earlier
        await UserModel.findByIdAndDelete(savedUser._id);
        return next(new InternalServerError("Profile creation failed"));
    }

    // Send email verification
    await sendEmail(req.body.email, "Verify your account", `Your OTP is ${otp}`);

    return res.status(201).json({
        message: "User account created!",
        user: savedUser,
        profile: savedProfile
    });
});


export const ValidateOpt = asyncWrapper(async (req, res, next) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new BadRequestError(errors.array()[0].msg));
    }

    // Checking if the given opt is stored in our database
    const foundUser = await UserModel.findOne({ otp: req.body.otp });
    if (!foundUser) {
        next(new UnauthorizedError('Authorization denied'));
    };

    // Checking if the otp is expired or not.
    if (foundUser.otpExpires < new Date().getTime()) {
        next(new UnauthorizedError('OTP expired'));
    }

    // Updating the user to verified
    foundUser.verified = true;
    const savedUser = await foundUser.save();

    if (savedUser) {
        return res.status(201).json({
            message: "User account verified!",
            user: savedUser
        });
    }
});

export const SignIn = asyncWrapper(async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new BadRequestError(errors.array()[0].msg));
    }

    const foundUser = await UserModel.findOne({ email: req.body.email });
    
    if (!foundUser) {
        res.status(404).send({error:'Invalid email or password'});
        return next(new BadRequestError("Invalid email or password!"));
    };

    if (!foundUser.verified) {
        return next(new BadRequestError("Your account is not verified!"));
    }
    
    const isPasswordVerified = await bcryptjs.compareSync(req.body.password, foundUser.password);
    if (!isPasswordVerified) {
        return next(new BadRequestError("Invalid email or password!"));
    }
    const token = jwt.sign({ id: foundUser.id, email: foundUser.email, role: foundUser.role }, configuration.JWT_SECRET, { expiresIn: "1h" });
    sendTokenCookie(token, res);
    let dashboardURL;
    if (foundUser.role === 'farmer') {
        dashboardURL = '/farmer/dashboard';
    } else if (foundUser.role === 'buyer') {
        dashboardURL = '/buyer/dashboard';
    }  else if (foundUser.role === 'goverment') {
        dashboardURL = '/buyer/goverment/dashboard';
    }
    else {
        // If the role is not specified or invalid, you can handle it accordingly
        return next(new BadRequestError("Invalid user role!"));
    }

    res.status(200).json({ message: 'User logged in!', token, dashboardURL });
});

export const loginWithGoogle=asyncWrapper(async(req,res,next)=>{

})

export const ForgotPassword = asyncWrapper(async (req, res, next) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new BadRequestError(errors.array()[0].msg));
    }

    // Find user
    const foundUser = await UserModel.findOne({ email: req.body.email });
    if (!foundUser) {
        return next(new BadRequestError("Your email is not registered!"));
    };

    // Generate token
    const token = jwt.sign({ id: foundUser.id }, configuration.JWT_SECRET, { expiresIn: "15m" });

    // Recording the token to the database
    await Token.create({
        token: token,
        user: foundUser._id,
        expirationDate: new Date().getTime() + (60 * 1000 * 5),
    });

    const link = `http://localhost:8060/reset-password?token=${token}&id=${foundUser.id}`;
    const emailBody = `Click on the link bellow to reset your password\n\n${link}`;

    await sendEmail(req.body.email, "Reset your password", emailBody);

    res.status(200).json({
        message: "We sent you a reset password link on your email!",
    });
});

export const ResetPassword = asyncWrapper(async (req, res, next) => {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new BadRequestError(errors.array()[0].msg));
    };

    // Verify token
    const decoded = await jwt.verify(req.body.token, configuration.JWT_SECRET);
    if (!decoded) {
        return next(new BadRequestError("Invalid token!"));
    }

    const recordedToken = await Token.findOne({ token: req.body.token });
    
    if (decoded.id!= req.body.id || recordedToken.user!= req.body.id) {
        return next(new BadRequestError("Invalid token!"));
    }

    if (new Date(recordedToken.expirationDate).getTime() < new Date().getTime()) {
        return next(new BadRequestError("Token expired!"));
    }

    // Find user
    const foundUser = await UserModel.findById(req.body.id);
    if (!foundUser) {
        return next(new BadRequestError("User not found!"));
    };

    // Deleting the user token
    await Token.deleteOne({ token: req.body.token });

    // Harshing the user password
    const hashedPassword = await bcryptjs.hashSync(req.body.password, 10);

    // Updating the user password
    foundUser.password = hashedPassword;

    const savedUser = await foundUser.save();
    if (savedUser) {
        return res.status(200).json({
            message: "Your password has been reset!",
        })
    }
});