import express from 'express';
const stockRouter = express.Router();
import { addStock,getStock,getStockByID,updateStock,deleteStock } from '../controllers/stock.controllers.js';
import { addStockValidations } from '../utils/validation.js';   
import {requireAuth} from '../middlewares/authorization.js'
import { getAllOrders,getOrder } from '../controllers/farmerOrder.controller.js';
import upload from '../utils/multer.js';
stockRouter.use(requireAuth)
stockRouter.post('/add',upload.single("image"),addStock);
stockRouter.get('/retrieve', getStock);
stockRouter.put('/update/:id', addStockValidations,updateStock);
stockRouter.delete('/delete/:id', deleteStock);
stockRouter.get('/retrieve/:id',getStockByID)
stockRouter.get('/allOrders',getAllOrders)
stockRouter.get('/getOrder/:id',getOrder)


export default stockRouter;