import jwt from "jsonwebtoken";
import configuration from "../configs/index.js";

// Middleware to extract user role from token in the Authorization header
export const attachUserRole = (req, res, next) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: 'No token provided.' });
        }

        const token = authorizationHeader.split(" ")[1];
        const decoded = jwt.verify(token, configuration.JWT_SECRET);
        const userRole = decoded.role;

        req.userRole = userRole;
        console.log(req.userRole);
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