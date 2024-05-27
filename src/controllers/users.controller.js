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
import Stock from "../models/stock.model.js"



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
    const role = await RoleModel.findOne({ role: req.body.role });

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
        return next(new BadRequestError("Invalid email or password!"));
    }

    if (!foundUser.verified) {
        return next(new BadRequestError("Your account is not verified!"));
    }
    
    const isPasswordVerified = await bcryptjs.compareSync(req.body.password, foundUser.password);
    if (!isPasswordVerified) {
        return next(new BadRequestError("Invalid email or password!"));
    }

    // Retrieve the role document based on the role ID stored in the user document
    const role = await RoleModel.findById(foundUser.role);

    // If role not found, handle error
    if (!role) {
        return next(new BadRequestError("Invalid user role!"));
    }
    
    // Log the role to ensure it's fetched correctly
    console.log("Role:", role);

    // Generate JWT token with user data and role
    const token = jwt.sign({ id: foundUser.id, email: foundUser.email, role: role.role }, configuration.JWT_SECRET, { expiresIn: "1h" });
    
    // Send the token as a cookie
    sendTokenCookie(token, res);

    // Respond with success message and token
    res.status(200).json({ message: 'User logged in!', token, role: role.role })
});


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

    const link = `http://localhost:5173/reset?id=${foundUser.id}`;
    const emailBody = `Click on the link below to reset your password\n\n${link}`;

    await sendEmail(req.body.email, "Reset your password", emailBody);

    // Set the token in the response headers
    res.setHeader('Authorization', `Bearer ${token}`);

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

    // Verify token from headers
    const token = req.headers.authorization.replace('Bearer ', '');
    const decoded = await jwt.verify(token, configuration.JWT_SECRET);
    if (!decoded) {
        return next(new BadRequestError("Invalid token!"));
    }

    const recordedToken = await Token.findOne({ token });

    if (decoded.id !== req.body.id || recordedToken.user !== req.body.id) {
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

    await Token.deleteOne({ token });
    const hashedPassword = await bcryptjs.hashSync(req.body.password, 10);
    foundUser.password = hashedPassword;

    const savedUser = await foundUser.save();
    if (savedUser) {
        return res.status(200).json({
            message: "Your password has been reset!",
        })
    }
});

export const getAllFarmersStock = async (req, res) => {
    try {
        // Fetch users and populate the role
        const users = await UserModel.find().populate('role').exec();
        console.log('Fetched users:', users);

        // Filter users to get only farmers
        const farmers = users.filter(user => user.role && user.role.role === 'farmer');
        console.log('Filtered farmers:', farmers);

        // Fetch profiles of the filtered farmers
        const profiles = await profileModel.find({ user: { $in: farmers.map(farmer => farmer._id) } }).exec();
        console.log('Fetched profiles for farmers:', profiles);

        // Retrieve stock items for each farmer by user ID
        const farmersWithStock = await Promise.all(profiles.map(async (profile) => {
            // Fetch stock items based on user ID
            const stockItems = await Stock.find({ user: profile.user }).exec();
            console.log(`Stock items for farmer ${profile.fullName}:`, stockItems);

            return { farmer: profile.fullName, stock: stockItems };
        }));

        res.json({ farmersWithStock });
    } catch (error) {
        console.error('Error fetching farmers with stock:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};