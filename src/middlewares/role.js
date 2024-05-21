import jwt from "jsonwebtoken";

import configuration from "../configs/index.js";

export const attachUserRole = (req, res, next) => {
    try {
        const token = req.cookies.token; // Extract token from cookie named 'token'
        if (!token) {
            return res.status(401).json({ message: 'No token provided.' });
        }

        const decoded = jwt.verify(token, configuration.JWT_SECRET);

        // Assuming the role is included in the token payload as 'role'
        const userRole = decoded.role;

        req.userRole = userRole;
        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Not authorized.' });
    }
};

// Middleware to authorize roles
export const authorizeRoles = (roles) => {
    return (req, res, next) => {
        try {
            if (!req.userRole || !roles.includes(req.userRole)) {
                return res.status(403).json({ message: 'Access denied.' });
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized.' });
        }
    };
};