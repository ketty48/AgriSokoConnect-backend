import express from 'express';
const stockRouter = express.Router();
import { addStock,getStock,getStockByID,updateStock,deleteStock } from '../controllers/stock.controllers.js';
import { addStockValidations } from '../utils/validation.js';   
import {requireAuth} from '../middlewares/authorization.js'
stockRouter.use(requireAuth)
stockRouter.post('/add', addStockValidations, addStock);
stockRouter.get('/retrieve', getStock);
stockRouter.get('/update/:id', addStockValidations,updateStock);
stockRouter.delete('/delete/:id', deleteStock);
stockRouter.get('/retrieve/:id',getStockByID)


export default stockRouter;