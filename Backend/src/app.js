const express = require("express");
const authRouter = require("./routes/auth.route")
const accountRouter = require("./routes/accounts.routes")
const cookieparser = require("cookie-parser")
const transactionRouter = require("./routes/transaction.route")

const app = express();
app.use(express.json())
app.use(cookieparser())
app.use("/api/auth", authRouter);
app.use("/api/v1/accounts", accountRouter);
app.use("/api/v1/transactions", transactionRouter);






module.exports = app;