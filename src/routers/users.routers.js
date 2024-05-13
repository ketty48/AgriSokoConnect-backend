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
userRouter.use(session({
  secret: configuration.JWT_SECRET,
  resave: false,
  saveUninitialized: true
}))
userRouter.use(passport.initialize());
userRouter.use(passport.session());
userRouter.get('/success', (req, res) => res.send(userProfile));
userRouter.get('/error', (req, res) => res.send("error logging in"));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});




passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALL_BACK_URL
  },
  async function(accessToken, refreshToken, profile, done) {
    userProfile=profile;


    try {
      let user = await UserModel.findOne({ googleId: profile.id });

      if (!user) {
        // Create a new user if not found in the database
        user = new UserModel({
          fullName: profile.displayName,
          email: profile.emails[0].value,
          userName: profile.displayName,
          password: profile.password,
          otp:otp,
          otpExpires: otpExpirationDate,
          role: 'buyer',
        });
        await user.save();

        // Create a new profile for the user
        const newProfile = new profileModel({
          user: user._id,
          fullName: profile.displayName,
          email: profile.emails[0].value,
         
        });
        await newProfile.save();
        await sendEmail(req.profile.emails[0].value, "Verify your account", `Your OTP is ${otp}`);
      }

      // Pass the user object to the done callback
      return done(null, user);
    } catch (err) {
  
      return done(err);
    }
  }
));

userRouter.get('/auth/google',

  passport.authenticate('google', { scope: ['profile', 'email'] }));

userRouter.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/dashboard');
  });

userRouter.get('/dashboard', (req, res) => {
  if (req.isAuthenticated()) {
    res.send('Dashboard');
  } else {
    res.redirect('/login');
  }
});

export default userRouter;