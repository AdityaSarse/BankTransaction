const mongoose = require("mongoose");

const ladgerSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        immutable: true
    },
    transactionID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: true,
        immutable: true,
        index: true
    },
    accountID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: true,
        immutable: true,
        index: true
    },
    type: {
        type: String,
        enum: ["DEBIT", "CREDIT"],
        required: true,
        immutable: true,
    }
}, {
    timestamps: true
})

function preventLadgerModifcation(next) {
    next(new Error("Ladger should not be modified"));
}

ladgerSchema.pre("save", function (next) {
    if (!this.isNew) {
        return next(new Error("Ladger should not be modified"));
    }
    next();
});
ladgerSchema.pre("update", preventLadgerModifcation)
ladgerSchema.pre("updateOne", preventLadgerModifcation)
ladgerSchema.pre("findOneAndUpdate", preventLadgerModifcation)
ladgerSchema.pre("remove", preventLadgerModifcation)
ladgerSchema.pre("delete", preventLadgerModifcation)
ladgerSchema.pre("deleteMany", preventLadgerModifcation)

const ladgerModel = new mongoose.model("ladger", ladgerSchema)

module.exports = ladgerModel;