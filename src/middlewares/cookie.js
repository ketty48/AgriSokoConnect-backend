import dotenv from 'dotenv'
const sendTokenCookie = (token, res) => {
  // Set the token as a cookie in the response
  res.cookie('token', token, {
      httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
      maxAge: 3600000, // Expires in 1 hour (in milliseconds)
      secure: process.env.NODE_ENV === 'production' // Ensures that the cookie is only sent over HTTPS in production
  });
};
export default sendTokenCookie;
  