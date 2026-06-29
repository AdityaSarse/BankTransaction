const express = require("express");

const { authMiddelware } = require("../middelware/auth.middelware");
const { createAccount, getAccounts, getAccountById } = require("../controllers/account.controller");

const router = express.Router();

router.post("/", authMiddelware, createAccount);
router.get("/", authMiddelware, getAccounts);
router.get("/:accountId", authMiddelware, getAccountById);

module.exports = router;