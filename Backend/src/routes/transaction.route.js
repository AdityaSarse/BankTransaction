const express = require("express");
const { createTransaction } = require("../controllers/transaction.controller");
const { authMiddelware } = require("../middelware/auth.middelware")

const router = express.Router();

router.post("/transfer", authMiddelware, createTransaction);

module.exports = router