import { Schema,model } from "mongoose";
const  orderSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false
     },
     stock:{
        type:Schema.Types.ObjectId,
        ref:'stock',
        required: false
     },
     
     quantity:{
        type: Number,
        required: false
     },
     quality:{
        type:"String",
        required: false
     },
     phoneNumber:{
        type:"Number",
        required: false,
     },
     Address:{
        type:"String",
        required: false,
     }
},{timestamps:true},
)
const orderModel = model('order',orderSchema);
export default orderModel;