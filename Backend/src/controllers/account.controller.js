const accountModel = require("../models/account.model");

async function createAccount(req, res) {
    try {
        const user = req.user;
        const { currency } = req.body;

        const newAccountData = {
            userId: user._id
        };

        if (currency) {
            newAccountData.currency = currency.toUpperCase();
        }

        const account = await accountModel.create(newAccountData);

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            account
        });
    } catch (error) {
        console.error("Failed to create account:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

async function getAccounts(req, res) {
    try {
        const user = req.user;
        const accounts = await accountModel.find({ userId: user._id });

        const accountsWithBalance = await Promise.all(accounts.map(async (acc) => {
            const balance = await acc.getBalance();
            return {
                ...acc.toObject(),
                balance
            };
        }));

        return res.status(200).json({
            success: true,
            accounts: accountsWithBalance
        });
    } catch (error) {
        console.error("Failed to fetch accounts:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

async function getAccountById(req, res) {
    try {
        const user = req.user;
        const { accountId } = req.params;

        const account = await accountModel.findOne({ _id: accountId, userId: user._id });
        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found"
            });
        }

        const balance = await account.getBalance();
        return res.status(200).json({
            success: true,
            account: {
                ...account.toObject(),
                balance
            }
        });
    } catch (error) {
        console.error("Failed to fetch account:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
}

module.exports = {
    createAccount,
    getAccounts,
    getAccountById
};