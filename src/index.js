
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import configurations from "./configs/index.js";
import Routers from "./routers/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./docs/swagger.json" assert { type: "json" };

const corsOptions = {
    allowedHeaders: ["Authorization","Content-Type"],
    methods: ["GET", "POST", "UPDATE" ],
    // origin: ["http://192.168.1.150:8080", "//https://contact-app-client-xbck.onrender.com/"],
}

const app = express();
app.use(cors());
app.use(express.json());
app.use('/AgriSoko', Routers);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/',(req,res)=>{
    res.status(200).json({
        message: 'Server is Up!'
    })
})


mongoose.connect(configurations.MONGODB_CONNECTION_STRING.toString())
.then(() => console.log("Connected to MongoDB"))
.catch(err => console.log(err));

app.listen(configurations.PORT, () => console.log(`Server is running on port ${configurations.PORT}`))