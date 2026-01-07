const express = require("express");
const dbConnect = require("./config/dbConnect");
const app = express();
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 10000; 
const authRouter = require("./routes/authRoute");
const transactionRouter = require("./routes/transactionRoute");
const cookieParser = require("cookie-parser");
const { errorHandler, notFound } = require("./middlewares/errorHandler");
const morgan = require("morgan");
const cors = require("cors");

dbConnect();

// Place this right after const app = express();
app.use(cors({
    origin: 'https://jambavan-finance-frontend.onrender.com',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add this small block to manually handle the 'OPTIONS' check
app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(morgan('dev'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/api/user", authRouter);
app.use("/api/transactions", transactionRouter);

app.use("/api/dashboard", transactionRouter )

app.use(notFound);
app.use(errorHandler);
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at PORT ${PORT}`);
});
