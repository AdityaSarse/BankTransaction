const express = require("express");
const { createTransaction, systemInitalFunds, getTransactions, getTransactionById } = require("../controllers/transaction.controller");
const { authMiddelware, adminMiddelware } = require("../middelware/auth.middelware");

const router = express.Router();

router.post("/transfer", authMiddelware, createTransaction);
router.post("/systemInital-funds", adminMiddelware, systemInitalFunds);
router.get("/", authMiddelware, getTransactions);
router.get("/:transactionId", authMiddelware, getTransactionById);

module.exports = router;