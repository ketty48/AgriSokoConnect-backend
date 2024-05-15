import express from 'express';
const orderRouter = express.Router();
 import { addOrder,getAllOrders,getOrder,deleteOrder,updateOrder} from '../controllers/order.controllers.js';
import { addOrderValidations } from '../utils/validation.js';
import { requireAuth } from '../middlewares/authorization.js';

orderRouter.use(requireAuth);
 orderRouter.post('/create',addOrderValidations, addOrder);
 orderRouter.get('/retrieve', getAllOrders);
orderRouter.put('/update/:id', addOrderValidations, updateOrder);
 orderRouter.delete('/delete/:id', deleteOrder);
orderRouter.get('/retrieve/:id', getOrder);

export default orderRouter;
