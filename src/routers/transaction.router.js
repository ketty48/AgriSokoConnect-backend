import express from 'express';
const router=express.Router();
import {createTransaction,getAllTransactions,getAllFarmersWithStock} from '../controllers/transaction.controller.js'
import {requireAuth} from '../middlewares/authorization.js'
import {authorizeRoles} from '../middlewares/role.js';
router.use(requireAuth)
router.post('/add',authorizeRoles(['goverment']),createTransaction);
router.get('/all',authorizeRoles(['goverment']),getAllTransactions)
router.get('/allFarmers',authorizeRoles(['goverment']),getAllFarmersWithStock)

export default router