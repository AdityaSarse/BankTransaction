const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model")
const ladgerModel = require("../models/ladger.model")
const accountModel = require("../models/account.model")

async function createTransaction(req, res) {

    const { fromAccount, toAccount, amount, idemponencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idemponencyKey) {
        return res.status(400).json({
            message: "Missing required fields",
            success: false
        })

    }
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(404).json({
            message: "Account not found",
            success: false
        })
    }

    /*2.validate idemponencyKey */

    const isTransactionExists = await transactionModel.findOne({
        idemponencyKey: idemponencyKey
    })
    if (isTransactionExists && isTransactionExists.status === "SUCCESS") {
        return res.status(200).json({
            message: "Transaction already exists",
            transaction: isTransactionExists
        })
    }

    if (isTransactionExists && isTransactionExists.status === "PENDING") {
        return res.status(200).json({
            message: "Transaction already in progress",
            transaction: isTransactionExists
        })
    }
    if (isTransactionExists && isTransactionExists.status === "FAILED") {
        return res.status(400).json({
            message: "Transaction failed",
            transaction: isTransactionExists
        })
    }
    if (isTransactionExists && isTransactionExists.status === "REVERSED") {
        return res.status(200).json({
            message: "Transaction reversed",
            transaction: isTransactionExists
        })
    }

    /*3. check Accoutn status */
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Account not active",
            success: false
        })
    }


}

async function transferMoney(req, res) {
    const session = await mongoose.startSession();

    session.startTransaction();

    try {
        const { toAccount, amount } = req.body;
        const fromAccount = req.user.account.id;

        if (!toAccount || !amount) {
            return res.status(400).json({
                message: "Missing required fields",
                success: false
            })
        }

        const fromAccountDoc = await accountModel.findById(fromAccount).session(session);
        const toAccountDoc = await accountModel.findById(toAccount).session(session);

        if (!fromAccountDoc || !toAccountDoc) {
            await session.abortTransaction();
            return res.status(404).json({
                message: "Account not found",
                success: false
            })
        }

        if (fromAccountDoc.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance",
                success: false
            })
        }

        const transaction = await transactionModel.create({
            fromAccount,
            toAccount,
            amount,
            status: "PENDING"
        })

        await session.commitTransaction();
        res.status(200).json({
            message: "Transaction created successfully",
            success: true,
            transaction
        })

    } catch (error) {
        await session.abortTransaction();
        console.error("Error creating transaction:", error);
        return res.status(500).json({
            message: "Failed to create transaction",
            success: false,
            error: error.message
        });
    } finally {
        session.endSession();
    }
}