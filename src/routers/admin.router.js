import  express from 'express';
const router = express.Router();
import { getAllFarmersWithStock, getAllBuyersWithOrders, removeUserProfile } from  '../controllers/admin.controller.js';
import {requireAuth} from '../middlewares/authorization.js'
import {authorizeRoles} from '../middlewares/role.js';
router.use(requireAuth)


router.get('/farmers',authorizeRoles(['admin']), getAllFarmersWithStock);
router.get('/buyers', authorizeRoles(['admin']),getAllBuyersWithOrders);
router.delete('/user/:userId',authorizeRoles(['admin']), removeUserProfile);

export default router;
