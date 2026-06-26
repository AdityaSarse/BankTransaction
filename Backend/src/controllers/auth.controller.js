const mongoose = require("mongoose");
const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")


async function registerUserController(req, res) {
    const { email, password, name } = req.body;


    const isExists = await userModel.findOne({
        email: email
    })

    if (isExists) {
        return res.status(422).json({
            message: "User with this email already exists",
            status: "failed"
        })
    }

    const user = await userModel.create({
        email,
        password,
        name
    })

    const token = jwt.sign({ userId: user._id }, process.env.JWT, { expiresIn: "3d" });

    res.cookie("token", token)

    res.status(201).json({

        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })
}

async function loginUserController(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        })
    }

    const user = await userModel.findOne({
        email: email
    }).select("+password")

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        })
    }

    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
        return res.status(401).json({
            message: "Incorrect password"
        })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT, { expiresIn: "3d" });

    res.cookie("token", token)

    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })

}

module.exports = {
    registerUserController,
    loginUserController
}