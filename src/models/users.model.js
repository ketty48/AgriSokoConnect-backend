import { Schema, model,mongoose } from 'mongoose';

const UserSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    userName: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    address1: {
        type: String,
        required: true,
    },
    address2: {
        type: String,
        required: true,
    },
    role: {
        type:"string",
        enum: {
            values: ["Goverment","Farmer", "Buyer"],
            message: "{VALUE} is not a valid status",
        },
        default: "Farmer",
    },
  

    otp: {
        type: Number,
        required: true
    },
    otpExpires: {
        type: Date,
        required: false,
    },
    verified: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    toJSON: {
        transform: (doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            delete ret.password;
            return ret;
        }
    },
    timestamps: true,
});

const userModel = model('User', UserSchema);

export default userModel;