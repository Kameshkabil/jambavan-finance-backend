const express = require("express");
const dbConnect = require("./config/dbConnect");
const app = express();
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 4000;
const authRouter = require("./routes/authRoute");
const transactionRouter = require("./routes/transactionRoute");
const cookieParser = require("cookie-parser");
const { errorHandler, notFound } = require("./middlewares/errorHandler");
const morgan = require("morgan");
const cors = require("cors");

dbConnect();

app.use(cors({
  origin: "https://jambavan-finance-frontend.onrender.com",
  credentials: true
}));

app.use(morgan('dev'));
app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/api/user/", authRouter);
app.use("/api/transactions/", transactionRouter);

app.use("/api/dashboard/", transactionRouter )

app.use(notFound);
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server is running at PORT ${PORT}`);
});
