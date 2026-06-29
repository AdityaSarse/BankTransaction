const express = require("express");
const { createTransaction, systemInitalFunds } = require("../controllers/transaction.controller");
const { authMiddelware, adminMiddelware } = require("../middelware/auth.middelware")

const router = express.Router();

router.post("/transfer", authMiddelware, createTransaction);

router.post("/systemInital-funds", adminMiddelware, systemInitalFunds)


module.exports = router