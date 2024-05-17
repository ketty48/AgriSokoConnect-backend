import express from 'express';
const stockRouter = express.Router();
import { addStock,getStock,getStockByID,updateStock,deleteStock } from '../controllers/stock.controllers.js';
import { addStockValidations } from '../utils/validation.js';   
import {requireAuth} from '../middlewares/authorization.js'
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString().replace(/:/g, '-') + path.extname(file.originalname));
  }
});

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
//     cb(null, true);
//   } else {
//     cb(new Error("Only images are allowed"), false);
//   }
// };

const upload = multer({ storage: storage});

// const uploadImage = upload.single('image'); // Ensure the field name is 'image'




stockRouter.use(requireAuth)
stockRouter.post('/add',upload.single("image"),addStock);
stockRouter.get('/retrieve', getStock);
stockRouter.put('/update/:id', addStockValidations,updateStock);
stockRouter.delete('/delete/:id', deleteStock);
stockRouter.get('/retrieve/:id',getStockByID)


export default stockRouter;