import express from 'express';
const router=express.Router();
import {createTransaction,getAllTransactions,getAllFarmersWithStock} from '../controllers/transaction.controller.js'
import {requireAuth} from '../middlewares/authorization.js'
router.use(requireAuth)
router.post('/add',createTransaction);
router.get('/all',getAllTransactions)
router.get('/allFarmers',getAllFarmersWithStock)

export default router