const mongoose = require("mongoose")

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

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel;