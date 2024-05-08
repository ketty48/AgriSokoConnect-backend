import { Schema, model,mongoose } from 'mongoose';

const UserSchema = new Schema({
    fullName: {
        type: String,
        required: true,
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
    address: {
        type: String,
        required: true,
    },
    PhoneNumber: {
        type: Number,
        required: true,
    },
    role: {
        type:"string",
        enum: {
            values: ["Goverment","Farmer", "Buyer","admin"],
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