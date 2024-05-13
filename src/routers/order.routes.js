import express from 'express';
const orderRouter = express.Router();
import { addOrder, getAllStock, getStockByID, updateStock, deleteStock } from '../controllers/order.controllers.js';
import { addOrderValidations } from '../utils/validation.js';
import { requireAuth } from '../middlewares/authorization.js';

orderRouter.use(requireAuth);

orderRouter.post('/create',addOrderValidations, addOrder);
orderRouter.get('/retrieve', getAllStock);
orderRouter.put('/update/:id', addOrderValidations, updateStock);
orderRouter.delete('/delete/:id', deleteStock);
orderRouter.get('/retrieve/:id', getStockByID);

export default orderRouter;
 