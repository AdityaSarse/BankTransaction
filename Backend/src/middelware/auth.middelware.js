const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")


async function authMiddelware(req, res, next) {

    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    try {
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT)
        const user = await userModel.findById(decoded.userId)

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized"
            })
        }

        req.user = user
        next()
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Internal server error"
        })
    }
}

async function adminMiddelware(req, res, next) {
    authMiddelware(req, res, () => {
        if (req.user.systemUser) {
            next()
        } else {
            res.status(401).json({
                message: "Unauthorized"
            })
        }
    })
}

module.exports = {
    authMiddelware,
    adminMiddelware
}