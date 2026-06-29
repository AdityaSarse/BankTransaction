const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true,
            "Email is required to register"
        ],
        trim: true,
        lowercase: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            "invalid email Address"
        ],
        unique: true
    },
    name: {
        type: String,
        required: [true,
            "Name is required for registration"
        ],
        unique: true
    },
    password: {
        type: String,
        required: [true,
            "Password is required..!"
        ],
        minlength: [8, "Minimum length should be 8"],
        select: false ///by default password iss not fetch for each query
    },
    systemUser: {
        type: Boolean,
        default: false,
        immutable: true
    }

})

userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash;
    return;
})

userSchema.methods.comparePassword = async function (password) {

    return await bcrypt.compare(password, this.password)

}

const userModel = mongoose.model("user", userSchema)


module.exports = userModel;