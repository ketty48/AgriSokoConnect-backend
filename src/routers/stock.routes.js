import express from 'express';
const stockRouter = express.Router();
import { addStock,getStock,getStockByID,updateStock,deleteStock } from '../controllers/stock.controllers.js';
import { addStockValidations } from '../utils/validation.js';   
import {requireAuth} from '../middlewares/authorization.js'
import { getAllOrders,getOrder } from '../controllers/farmerOrder.controller.js';
import { authorizeRoles, attachUserRole } from '../middlewares/role.js';
stockRouter.use(requireAuth)
stockRouter.post('/add',attachUserRole, authorizeRoles(['farmer']), addStockValidations, addStock);
stockRouter.get('/retrieve',attachUserRole, authorizeRoles(['farmer']), getStock);
stockRouter.put('/update/:id',attachUserRole, authorizeRoles(['farmer']), addStockValidations,updateStock);
stockRouter.delete('/delete/:id',attachUserRole, authorizeRoles(['farmer']), deleteStock);
stockRouter.get('/retrieve/:id',attachUserRole, authorizeRoles(['farmer']),getStockByID)
stockRouter.get('/allOrders',attachUserRole, authorizeRoles(['farmer']),getAllOrders)
stockRouter.get('/getOrder/:id',attachUserRole, authorizeRoles(['farmer']),getOrder)


export default stockRouter;