const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model")
const ladgerModel = require("../models/ladger.model")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")
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

    /*4. drive balance*/

    const fromUserBalance = await fromUserAccount.getBalance()
    const toUserBalance = await toUserAccount.getBalance()

    if (fromUserBalance < amount) {
        return res.status(400).json({
            message: "Insufficient balance",
            success: false
        })
    }
    /*5.create transaction PENDING*/

    const session = await mongoose.startSession();

    session.startTransaction();

    const transaction = await transactionModel.create({
        fromAccount,
        toAccount,
        amount,
        idemponencyKey,
        status: "PENDING"
    }, {
        session
    })

    const debitLadger = await ladgerModel.create({
        accountId: fromAccount,
        amount: -amount,
        transactionId: transaction._id,

    }, {
        session
    })

    const creditLadger = await ladgerModel.create({
        accountId: toAccount,
        amount: amount,
        transactionId: transaction._id,
    }, {
        session
    })

    transaction.status = "SUCCESS";
    await transaction.save();

    await session.commitTransaction();
    session.endSession();

    //send Transaction mail to both users

    await emailSerivices.sendEmail({
        to: fromUserAccount.email,
        subject: "Transaction successful",
        text: `Transaction of ${amount} from your account ${fromAccount} to ${toAccount} is successful`,
    })

    await emailSerivices.sendEmail({
        to: toUserAccount.email,
        subject: "Transaction successful",
        text: `Transaction of ${amount} from ${fromAccount} to your account ${toAccount} is successful`,
    })

    return res.status(200).json({
        message: "Transaction created successfully",
        transaction
    })

}

module.exports = {
    createTransaction
}