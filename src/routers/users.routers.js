import express from 'express';
const userRouter = express.Router();
import { SignUp, SignIn, ValidateOpt, ForgotPassword, ResetPassword} from '../controllers/users.controller.js';
import { signUpValidations, signInValidations, otpValidation, forgotPasswordValidation, resetPasswordValidation } from '../utils/validation.js';
import configuration from '../configs/index.js'
userRouter.post('/signup', signUpValidations, SignUp);
userRouter.post('/signin', signInValidations, SignIn);
userRouter.post('/verify', otpValidation, ValidateOpt);
userRouter.post('/forgotPassword', forgotPasswordValidation, ForgotPassword)
userRouter.post('/resetPassword', resetPasswordValidation, ResetPassword);
userRouter.use(cors());
userRouter.use(session({
    secret: configuration.JWT_SECRET,
    resave: false,
    saveUninitialized: true
}))

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
userRouter.use(passport.initialize());
userRouter.use(passport.session());
passport.use(new GoogleStrategy({
    clientID: configuration.clientID,
    clientSecret: configuration.clientSecret,
    callbackURL: configuration.callbackURL
  },
  async function(accessToken, refreshToken, profile, done) {
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

passport.serializeUser(function(user, done) {
    done(null, user.id); // Serialize the user ID
});

passport.deserializeUser(function(id, done) {
    UserModel.findById(id, function(err, user) {
        done(err, user); // Deserialize the user object
    });
});


export default userRouter;