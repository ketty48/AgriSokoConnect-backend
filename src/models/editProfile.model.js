import { Schema, model,mongoose } from 'mongoose';

const ProfileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false,
        unique: true,
    },
    address1: {
        type: String,
        required: false,
    },
    address2: {
        type: String,
        required: false,
    },
    PhoneNumber: {
        type: Number,
        required: true,
    },
    

}, {

    timestamps: true,
});

const profileModel = model('Profile', ProfileSchema);

export default profileModel;