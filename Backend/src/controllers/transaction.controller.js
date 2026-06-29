const mongoose = require("mongoose");
const transactionModel = require("../models/transaction.model");
const ladgerModel = require("../models/ladger.model");
const accountModel = require("../models/account.model");
const { sendEmail } = require("../services/email.services");

async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idemponencyKey } = req.body;

    if (!fromAccount || !toAccount || !amount || !idemponencyKey) {
        return res.status(400).json({
            message: "Missing required fields",
            success: false
        });
    }

    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    }).populate("userId");

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    }).populate("userId");

    if (!fromUserAccount || !toUserAccount) {
        return res.status(404).json({
            message: "Account not found",
            success: false
        });
    }

    /*2.validate idemponencyKey */
    const isTransactionExists = await transactionModel.findOne({
        idemponencyKey: idemponencyKey
    });

    if (isTransactionExists && isTransactionExists.status === "SUCCESS") {
        return res.status(200).json({
            message: "Transaction already exists",
            transaction: isTransactionExists
        });
    }

    if (isTransactionExists && isTransactionExists.status === "PENDING") {
        return res.status(200).json({
            message: "Transaction already in progress",
            transaction: isTransactionExists
        });
    }

    if (isTransactionExists && isTransactionExists.status === "FAILED") {
        return res.status(400).json({
            message: "Transaction failed",
            transaction: isTransactionExists
        });
    }

    if (isTransactionExists && isTransactionExists.status === "REVERSED") {
        return res.status(200).json({
            message: "Transaction reversed",
            transaction: isTransactionExists
        });
    }

    /*3. check Account status */
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Account not active",
            success: false
        });
    }

    /*4. drive balance*/
    const fromUserBalance = await fromUserAccount.getBalance();

    if (fromUserBalance < amount) {
        return res.status(400).json({
            message: "Insufficient balance",
            success: false
        });
    }

    /*5.create transaction PENDING*/
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const createdTransactions = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idemponencyKey,
            status: "PENDING"
        }], {
            session
        });
        const transaction = createdTransactions[0];

        await ladgerModel.create([{
            accountID: fromAccount,
            amount: amount,
            transactionID: transaction._id,
            type: "DEBIT"
        }], {
            session
        });

        await ladgerModel.create([{
            accountID: toAccount,
            amount: amount,
            transactionID: transaction._id,
            type: "CREDIT"
        }], {
            session
        });

        transaction.status = "SUCCESS";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        //send Transaction mail to both users
        const fromUserEmail = fromUserAccount.userId ? fromUserAccount.userId.email : null;
        const toUserEmail = toUserAccount.userId ? toUserAccount.userId.email : null;

        if (fromUserEmail) {
            try {
                await sendEmail(
                    fromUserEmail,
                    "Transaction successful",
                    `Transaction of ${amount} from your account ${fromAccount} to ${toAccount} is successful`
                );
            } catch (error) {
                console.error("Failed to send transaction email to sender:", error);
            }
        }

        if (toUserEmail) {
            try {
                await sendEmail(
                    toUserEmail,
                    "Transaction successful",
                    `Transaction of ${amount} from ${fromAccount} to your account ${toAccount} is successful`
                );
            } catch (error) {
                console.error("Failed to send transaction email to receiver:", error);
            }
        }

        return res.status(200).json({
            message: "Transaction created successfully",
            transaction
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Transaction failed:", error);
        return res.status(500).json({
            message: "Transaction failed",
            success: false,
            error: error.message
        });
    }
}

async function systemInitalFunds(req, res) {
    const { amount, toAccount, idemponencyKey } = req.body;

    if (!toAccount || !amount || !idemponencyKey) {
        return res.status(400).json({
            message: "Missing required fields",
            success: false
        });
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    }).populate("userId");

    if (!toUserAccount) {
        return res.status(404).json({
            message: "Account not found",
            success: false
        });
    }

    const isTransactionExists = await transactionModel.findOne({
        idemponencyKey: idemponencyKey
    });

    if (isTransactionExists && isTransactionExists.status === "SUCCESS") {
        return res.status(200).json({
            message: "Transaction already exists",
            transaction: isTransactionExists
        });
    }

    if (isTransactionExists && isTransactionExists.status === "PENDING") {
        return res.status(200).json({
            message: "Transaction already in progress",
            transaction: isTransactionExists
        });
    }

    if (isTransactionExists && isTransactionExists.status === "FAILED") {
        return res.status(400).json({
            message: "Transaction failed",
            transaction: isTransactionExists
        });
    }

    if (isTransactionExists && isTransactionExists.status === "REVERSED") {
        return res.status(200).json({
            message: "Transaction reversed",
            transaction: isTransactionExists
        });
    }

    const systemUser = req.user;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        let systemAccount = await accountModel.findOne({ userId: systemUser._id, status: "ACTIVE" }).session(session);
        if (!systemAccount) {
            const createdAccounts = await accountModel.create([{
                userId: systemUser._id,
                status: "ACTIVE",
                currency: toUserAccount.currency
            }], { session });
            systemAccount = createdAccounts[0];
        }

        const fromAccount = systemAccount._id;

        const createdTransactions = await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idemponencyKey,
            status: "PENDING"
        }], {
            session
        });
        const transaction = createdTransactions[0];

        await ladgerModel.create([{
            accountID: fromAccount,
            amount: amount,
            transactionID: transaction._id,
            type: "DEBIT"
        }], {
            session
        });

        await ladgerModel.create([{
            accountID: toAccount,
            amount: amount,
            transactionID: transaction._id,
            type: "CREDIT"
        }], {
            session
        });

        transaction.status = "SUCCESS";
        await transaction.save({ session });

        await session.commitTransaction();
        session.endSession();

        const systemEmail = systemUser.email;
        const toUserEmail = toUserAccount.userId ? toUserAccount.userId.email : null;

        if (systemEmail) {
            try {
                await sendEmail(
                    systemEmail,
                    "Transaction successful",
                    `Transaction of ${amount} from your account ${fromAccount} to ${toAccount} is successful`
                );
            } catch (error) {
                console.error("Failed to send transaction email to system user:", error);
            }
        }

        if (toUserEmail) {
            try {
                await sendEmail(
                    toUserEmail,
                    "Transaction successful",
                    `Transaction of ${amount} from ${fromAccount} to your account ${toAccount} is successful`
                );
            } catch (error) {
                console.error("Failed to send transaction email to receiver:", error);
            }
        }

        return res.status(200).json({
            message: "Transaction created successfully",
            transaction
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("System initial funds failed:", error);
        return res.status(500).json({
            message: "Transaction failed",
            success: false,
            error: error.message
        });
    }
}

async function getTransactions(req, res) {
    try {
        const user = req.user;
        const accounts = await accountModel.find({ userId: user._id });
        const accountIds = accounts.map(acc => acc._id);

        const transactions = await transactionModel.find({
            $or: [
                { fromAccount: { $in: accountIds } },
                { toAccount: { $in: accountIds } }
            ]
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            transactions
        });
    } catch (error) {
        console.error("Failed to fetch transactions:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

async function getTransactionById(req, res) {
    try {
        const user = req.user;
        const { transactionId } = req.params;

        const transaction = await transactionModel.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        const accounts = await accountModel.find({ userId: user._id });
        const accountIds = accounts.map(acc => acc._id.toString());

        const isOwner = accountIds.includes(transaction.fromAccount.toString()) || 
                        accountIds.includes(transaction.toAccount.toString());

        if (!isOwner) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized to view this transaction"
            });
        }

        const ledgers = await ladgerModel.find({ transactionID: transaction._id });

        return res.status(200).json({
            success: true,
            transaction,
            ledgers
        });
    } catch (error) {
        console.error("Failed to fetch transaction details:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = {
    createTransaction,
    systemInitalFunds,
    getTransactions,
    getTransactionById
};