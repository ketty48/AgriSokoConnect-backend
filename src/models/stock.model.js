import {Schema , model} from 'mongoose';

const orderSchema = new Schema({
 user:{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
 }
 ,
 NameOfProduct:{
    type: String,
    required: false
 },
 Description:{
    type: String,
    required: false
 },
 pricePerTon:{
   type: Number,
   required: false
 },
 quantity:{
   type: Number,
   required: false
 },
totalPrice:{
   type: Number,
   required: false
 },
}
,
 {timestamps:true}
)
const stockModel = model('stock',orderSchema)
export default stockModel