import express from 'express';
import { createMessage, getAllMessages, getMessageById, updateMessageById, deleteMessageById } from '../controllers/message.controller.js';
import { requireAuth } from '../middlewares/authorization.js';
import { attachUserRole, authorizeRoles } from '../middlewares/role.js';

const messageRouter = express.Router();

messageRouter.use(requireAuth);

messageRouter.post('/create', attachUserRole, authorizeRoles(['farmer', 'buyer']), createMessage);
messageRouter.get('/get', attachUserRole, authorizeRoles(['farmer', 'buyer']), getAllMessages);
messageRouter.get('get/:messageId', attachUserRole, authorizeRoles(['farmer', 'buyer']), getMessageById);
messageRouter.put('/:messageId', attachUserRole, authorizeRoles(['farmer', 'buyer']), updateMessageById);
messageRouter.delete('/:messageId', attachUserRole, authorizeRoles(['farmer', 'buyer']), deleteMessageById);

export default messageRouter;
