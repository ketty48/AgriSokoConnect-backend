import express from 'express';
const stockRouter = express.Router();
import { addStock,getStock,getStockByID,updateStock,deleteStock,getStocks,getOrdersByFarmerId } from '../controllers/stock.controllers.js';
import { addStockValidations } from '../utils/validation.js';   
import {requireAuth} from '../middlewares/authorization.js'
import { getAllOrders,getOrder } from '../controllers/farmerOrder.controller.js';

import { authorizeRoles, attachUserRole } from '../middlewares/role.js';
import multer from "multer"
const upload = multer({dest: 'uploads/'})


stockRouter.use(requireAuth)
stockRouter.post('/add',upload.fields([{name:'image',maxCount:1}]),addStock);
stockRouter.post('/add',attachUserRole, authorizeRoles(['farmer']), upload.single("image"), addStock);
stockRouter.get('/retrieve',attachUserRole, authorizeRoles(['farmer','buyer']), getStock);
stockRouter.put('/update/:id',attachUserRole, authorizeRoles(['farmer']), addStockValidations,updateStock);
stockRouter.delete('/delete/:id',attachUserRole, authorizeRoles(['farmer']), deleteStock);
stockRouter.get('/retrieve/:id',attachUserRole, authorizeRoles(['farmer']),getStockByID)
stockRouter.get('/allOrders',attachUserRole, authorizeRoles(['farmer']),getAllOrders)
stockRouter.get('/getOrder/:id',attachUserRole, authorizeRoles(['farmer']),getOrder)
stockRouter.get('/getAll',attachUserRole, authorizeRoles(['farmer','buyer']), getStocks);
stockRouter.get('/getAllOrders',attachUserRole, authorizeRoles(['farmer']), getOrdersByFarmerId );

export default stockRouter;