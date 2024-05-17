import  express from 'express';
const router = express.Router();
import { getAllFarmersWithStock, getAllBuyersWithOrders, removeUserProfile,countBuyer,countFarmer,countStock,countOrder ,countAccounts } from  '../controllers/admin.controller.js';
import {requireAuth} from '../middlewares/authorization.js'
import {authorizeRoles} from '../middlewares/role.js';
router.use(requireAuth)


router.get('/farmers',authorizeRoles(['admin']), getAllFarmersWithStock);
router.get('/buyers', authorizeRoles(['admin']),getAllBuyersWithOrders);
router.delete('/user/:userId',authorizeRoles(['admin']), removeUserProfile);
router.get('/totalFarmer',authorizeRoles(['admin']),countFarmer)
router.get('/totalBuyer',authorizeRoles(['admin']),countBuyer)
router.get('/totalStock',authorizeRoles(['admin']),countStock)
router.get('/totalOrder',authorizeRoles(['admin']),countOrder)
router.get('/totalUsers',authorizeRoles(['admin']),countAccounts)
export default router;
