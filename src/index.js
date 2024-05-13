import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import configurations from "./configs/index.js";
import Routers from "./routers/index.js";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./docs/swagger.json" assert { type: "json" };

const corsOptions = {
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PUT"], // Include PUT instead of UPDATE
    origin: ["https://agrisoko-connect-platform.netlify.app", "https://accounts.google.com"], // Remove trailing slashes
}

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use('/AgriSoko', Routers);
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
