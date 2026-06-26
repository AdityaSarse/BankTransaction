const { default: mongoose } = require("mongoose");
const userModel = require("../models/user.model")


async function registerUserController(req, res) {
    const { email, password, Name } = req.body;


    const isExists = await userModel.findOne({
        email: email
    })

    if (isExists) {
        return res.status(422).json({
            message: "User with this email already exists",
            status: "failed"
        })
    }

    const createUser =
}

module.exports = {
    registerUserController
}