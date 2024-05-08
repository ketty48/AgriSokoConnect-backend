import dotenv from 'dotenv'
const sendTokenCookie = (token, res) => {
    // Set cookie options
    const options = {
      httpOnly: true, // Cookie is only accessible via HTTP(S) and not JavaScript
      secure: process.env.NODE_ENV === 'production', // Cookie is only sent over HTTPS in production
      maxAge: 3600000, // Cookie expires in 1 hour (in milliseconds)
      sameSite: 'strict' // Cookie is sent with same-site restrictions
    };
  
    // Set the token as a cookie
    res.cookie('token', token, options);
  };
export default sendTokenCookie;
  