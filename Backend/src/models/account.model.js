const mongoose = require("mongoose")
const ladgerModel = require("./ladger.model")
const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true,
            "Account must be belong to a user"
        ],
        index: true
    },
    status: {
        type: String,
        enum: ["ACTIVE", "CLOSED", "FROZEN"],
        default: "ACTIVE"
    },
    currency: {
        type: String,
        enum: ["INR", "USD", "EUR"],
        default: "INR"
    }

}, {
    timestamps: true
})

accountSchema.index({ userId: 1, status: 1 })

accountSchema.methods.getBalance = async function () {
    const balanceData = await ladgerModel.aggregate([
        {
            $match: {
                accountID: this._id
            }
        },
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "DEBIT"] },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                balance: {
                    $subtract: [
                        "$totalCredit",
                        "$totalDebit"
                    ]
                }
            }
        }
    ])

    if (balanceData.length === 0) {
        return 0;
    }

    const totalDebit = balanceData[0].totalDebit || 0;
    const totalCredit = balanceData[0].totalCredit || 0;

    return totalCredit - totalDebit;

}

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel;