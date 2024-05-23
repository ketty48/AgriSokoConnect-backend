import {Schema,model} from 'mongoose'

const contactSchema = new Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    phoneNumber:{
        type:String,
        required:true
    },
    subject:{
        type:String,
        required:true,
    },
    message:{
        type:String,
        required:true,
    }
},{timestamps:true})

const contactModel = model('contact',contactSchema)
export default contactModel
