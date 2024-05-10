import { Schema, model,mongoose } from 'mongoose';

const RoleSchema = new Schema({
    role: {
        type:"string"
    },


});

const roleModel = model('Role', RoleSchema);

export default roleModel;