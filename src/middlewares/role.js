import jwt from 'jsonwebtoken';
import User from '../models/users.model.js';
import configuration from '../configs/index.js';
import Role from '../models/role.model.js';

const authorizeRoles = (roles) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, configuration.JWT_SECRET);
            // console.log('Decoded User:', decoded);

            const user = await User.findById(decoded.id);
            // console.log('User from Database:', user);

            const userRole = await Role.findById(user.role); // Assuming Role is your model for roles
            // console.log('User Role:', userRole);

            if (!userRole || userRole.role !== 'goverment') {
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
