import jwt from "jsonwebtoken";
import User from "../models/users.model.js";
import configuration from "../configs/index.js";

const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decodedToken = jwt.verify(token, configuration.JWT_SECRET);

    const user = await User.findById(decodedToken.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export { requireAuth };
