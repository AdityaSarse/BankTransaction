const express = require("express");

const { authMiddelware } = require("../middelware/auth.middelware");
const { createAccount } = require("../controllers/account.controller");

const router = express.Router();

router.post("/", authMiddelware, createAccount)

module.exports = router