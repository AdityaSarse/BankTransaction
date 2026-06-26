const mongoose = require("mongoose")
const bcrypt = require("bcrypt")

const userSchema = mongoose.Schema({
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
        require: [true,
            "Password is required..!"
        ],
        minlenght: [8, "Minimum lenght should be 8"],
        select: false ///by default password iss not fetch for each query
    },

})

userSchema.pre("save", async function(next) {
    if (!this.isModified(password)) {
        return next();
    }
    const hash = await bcrypt.hash(this.password, 10)
    this.paswword = hash;
    return next();
})

userSchema.method.comparePassword = async function(password) {

    return await bcrypt.compare(password, this.password)

}

const userModel = mongoose.model("user", userSchema)


module.exports = userModel;