// middleware/auth.js

import jwt from 'jsonwebtoken';
import User from '../models/users.model.js';
import configuration from '../configs/index.js'

const requireAuth = async (req, res, next) => {
    try {
        // Extract the token from the request headers
        const token = req.headers.authorization.split(' ')[1];

        // Check if the token exists
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Verify the token
        const decodedToken = jwt.verify(token, configuration.JWT_SECRET);

        // Check if the user exists
        const user = await User.findById(decodedToken.id);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Attach the user to the request object for later use
        req.user = user 

        // Move to the next middleware or route handler
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

export { requireAuth };