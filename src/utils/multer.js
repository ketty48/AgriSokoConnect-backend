// src/routes/stock.routes.js
import express from 'express';
import multer from 'multer';
import { addStock } from '../controllers/stock.controllers.js';

// Define storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Initialize multer with storage configuration
const upload = multer({ storage });

const router = express.Router();



export default router;
