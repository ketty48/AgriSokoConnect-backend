import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import configurations from "./configs/index.js";
import Routers from "./routers/index.js";
import swaggerUi from "swagger-ui-express";
import cookieParser from 'cookie-parser';
import swaggerDocument from "./docs/swagger.json" assert { type: "json" };
import bodyParser from "body-parser";
//import swaggerDocumentation from "./docs/swagger.json";


const corsOptions = {
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PUT", "DELETE"], // Include DELETE if needed
    // origin: ["http://localhost:8060", "https://agrisoko-connect-platform.netlify.app","http://localhost:5174","http://localhost:5173","https://agrisokoconnect-backend-ipza.onrender.com"], // Update with your Swagger UI origin
    origin: ["*"], // Update with your Swagger UI origin
    credentials: true, // Allow sending cookies for authorization
};

const app = express();
app.use(cors(corsOptions));
app.options('*',cors(corsOptions))
app.use(express.json());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended:false }));
app.use(cookieParser());

app.use('/AgriSoko', Routers,);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/', (req, res) => {
    res.status(200).json({
        message: 'Server is Up!'
    });
});

mongoose.connect(configurations.MONGODB_CONNECTION_STRING.toString(), { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log(err));

app.listen(configurations.PORT, () => console.log(`Server is running on port ${configurations.PORT}`));
