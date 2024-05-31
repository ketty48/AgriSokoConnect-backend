import express from 'express';
const orderRouter = express.Router();
 import { addOrder,getAllOrders,getOrder,deleteOrder,updateOrder,adminDeleteOrder } from '../controllers/order.controllers.js';
import { addOrderValidations } from '../utils/validation.js';
import { requireAuth } from '../middlewares/authorization.js';
import { authorizeRoles, attachUserRole } from '../middlewares/role.js';
orderRouter.use(requireAuth);
 orderRouter.post('/create',attachUserRole, authorizeRoles(['buyer']),addOrderValidations, addOrder);
 orderRouter.get('/retrieve',attachUserRole, authorizeRoles(['buyer']), getAllOrders);
 orderRouter.put('/update/:id', attachUserRole, authorizeRoles(['buyer', 'farmer', 'admin']), addOrderValidations, updateOrder);
 orderRouter.delete('/delete/:id',attachUserRole, authorizeRoles(['buyer']), deleteOrder);
 orderRouter.delete('/remove/:id',attachUserRole, authorizeRoles(['admin']), adminDeleteOrder );
orderRouter.get('/retrieve/:id', attachUserRole, authorizeRoles(['buyer']),getOrder);

export default orderRouter;
