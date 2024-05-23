import UserModel from "../models/users.model.js";
import asyncWrapper from "../middlewares/async.js";
import { BadRequestError } from "../errors/index.js";
import profileModel from "../models/editProfile.model.js"


export const updateUser = asyncWrapper(async (req, res, next) => {
  const userId = req.user.id;

  // Find the user profile associated with the logged-in user
  const user = await profileModel.findOne({ user: userId });
  if (!user) {
      return next(new BadRequestError("User not found!"));
  }

  // Update only the fields present in req.body
  const updatedUser = await profileModel.findByIdAndUpdate(
      user._id,
      { $set: req.body },
      { new: true, runValidators: true } // Ensure validators are run on the updated fields
  );

  if (!updatedUser) {
      return next(new InternalServerError("Failed to update user!"));
  }

  res.status(200).json({ message: 'User updated successfully', updatedUser });
});



export const getUserIfo = asyncWrapper(async (req, res, next) => {
    
    const userId = req.user.id;
    
    try {
      const user= await profileModel.findOne({  user: userId });
      if (!user) {
        return next(new NotFoundError(`User not found`));
      }
      res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  });