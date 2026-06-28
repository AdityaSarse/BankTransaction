const express = require("express");
const authRouter = require("./routes/auth.route")
const accountRouter = require("./routes/accounts.routes")
const cookieparser = require("cookie-parser")


const app = express();
app.use(express.json())
app.use(cookieparser())
app.use("/api/auth", authRouter);
app.use("/api/v1/accounts", accountRouter);





module.exports = app;