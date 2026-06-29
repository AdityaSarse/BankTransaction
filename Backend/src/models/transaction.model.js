const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["SUCCESS", "FAILED", "PROCESSING", "REVERSED", "PENDING"],
        default: "PROCESSING"
    },
    idemponencyKey: {
        type: String,
        unique: true,
        required: true
    }
}, {
    timestamps: true
})

transactionSchema.index({ idemponencyKey: 1 })
const transactionModel = mongoose.model("transaction", transactionSchema);
module.exports = transactionModel;
