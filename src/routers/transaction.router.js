import express from 'express';
const router=express.Router();
import {getAllFarmersWithStock,getAllTransactions,getAllTaxes} from '../controllers/transaction.controller.js'
import {requireAuth} from '../middlewares/authorization.js'

import { authorizeRoles, attachUserRole } from '../middlewares/role.js';
router.use(requireAuth)
// router.post('/add',authorizeRoles(['goverment']),createTransaction);
// router.get('/all',authorizeRoles(['goverment']),getAllTransactions)
router.get('/allFarmers',attachUserRole, authorizeRoles(['goverment']),getAllFarmersWithStock)
router.get('/allTransaction', attachUserRole, authorizeRoles(['goverment']), getAllTransactions);
router.get('/allTaxes', attachUserRole, authorizeRoles(['goverment']), getAllTaxes);

export default router