import dotenv from 'dotenv';
dotenv.config();

const Configs = {
    MONGODB_CONNECTION_STRING: process.env.MONGODB_URI,
    CLIENT_APP: process.env.CLIENT_APP || '',
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET_KEY,
    JWT_EXPIRES_IN: process.env.EXPIRATION,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    JWT_REFRESH_COOKIE_NAME: process.env.JWT_REFRESH_COOKIE_NAME,
    clientID: process.env.CLIENT_ID,
    client: process.env.clientSecret,
    callbackURL: process.env.callbackURL
}

export default Configs;



