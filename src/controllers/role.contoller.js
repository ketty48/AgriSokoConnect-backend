import roleModel from "../models/role.model.js";
import asyncWrapper from "../middlewares/async.js";
import bcryptjs from 'bcryptjs';
import { BadRequestError } from "../errors/index.js";
import { validationResult } from "express-validator";

export const addRole = asyncWrapper(async(req,res,next)=>{

    const newRole = await roleModel.create(req.body);
    return res.status(201).json(newRole);
})
export const getRoles = asyncWrapper(async (req, res, next) => {
    const roles = await roleModel.find({}, { role: 1 }); // Include only the 'name' field
    res.status(200).json(roles);
});

