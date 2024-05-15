import jwt from 'jsonwebtoken';
import User from '../models/users.model.js';
import configuration from '../configs/index.js';
import Role from '../models/role.model.js';

const authorizeRoles = (roles) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, configuration.JWT_SECRET);

            const user = await User.findById(decoded.id).populate('role'); // Populate role directly if stored as reference
            if (!user) {
                return res.status(401).json({ message: 'User not found.' });
            }

            const userRole = await Role.findById(user.role);
            if (!userRole || !roles.includes(userRole.role)) {
                return res.status(403).json({ message: 'Access denied.' });
            }

            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized.' });
        }
    };
}

export { authorizeRoles };
