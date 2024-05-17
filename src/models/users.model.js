import { Schema, model,mongoose } from 'mongoose';
import Profile from './editProfile.model.js'

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: 'Role',
        required: true
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
    },

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
UserSchema.pre('remove', async function (next) {
    try {
        await Profile.findOneAndDelete({ user: this._id});
        next();
    } catch (err) {
        next(err);
    }
});

const userModel = model('User', UserSchema);

export default userModel;