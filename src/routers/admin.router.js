import  express from 'express';
const router = express.Router();
import { getAllFarmersWithStock, getAllBuyersWithOrders, removeUserProfile,countBuyer,countFarmer,countStock,countOrder ,countAccounts } from  '../controllers/admin.controller.js';
import {requireAuth} from '../middlewares/authorization.js'
import { authorizeRoles, attachUserRole } from '../middlewares/role.js';
router.use(requireAuth)


router.get('/farmers',attachUserRole, authorizeRoles(['admin']), getAllFarmersWithStock);
router.get('/buyers', attachUserRole, authorizeRoles(['admin']),getAllBuyersWithOrders);
router.delete('/user/:userId',attachUserRole, authorizeRoles(['admin']), removeUserProfile);
router.get('/totalFarmer',attachUserRole, authorizeRoles(['admin']),countFarmer)
router.get('/totalBuyer',attachUserRole, authorizeRoles(['admin']),countBuyer)
router.get('/totalStock',attachUserRole, authorizeRoles(['admin']),countStock)
router.get('/totalOrder',attachUserRole, authorizeRoles(['admin']),countOrder)
router.get('/totalUsers',attachUserRole, authorizeRoles(['admin']),countAccounts)
export default router;
