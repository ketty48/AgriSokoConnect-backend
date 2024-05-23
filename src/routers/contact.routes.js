import express from 'express';
import {
    addContact,
    getContact,
    getContactFromEmail,
    getContactById,
    deleteContact,
    updatedContact
} from '../controllers/contact.controllers.js';

const contactRouter = express.Router();
contactRouter.post('/add', addContact);
contactRouter.get('/get', getContact);
contactRouter.get('/contact/:email', getContactFromEmail);
contactRouter.get('/get/:id', getContactById);
contactRouter.put('/update/:id', updatedContact);
contactRouter.delete('/delete/:id', deleteContact);

export default contactRouter;
