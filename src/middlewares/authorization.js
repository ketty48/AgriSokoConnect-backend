import jwt from "jsonwebtoken";
import User from "../models/users.model.js";
import configuration from "../configs/index.js";

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Authorization header missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing from header" });
    }

    console.log('Token:', token);

    const decodedToken = jwt.verify(token, configuration.JWT_SECRET);
    console.log('decodedToken:', decodedToken);

    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Error during token verification:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export { requireAuth };
