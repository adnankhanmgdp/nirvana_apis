const User = require('../../models/user.model');
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.auth = async (req, res, next) => {
    try {
        const { token } = req.headers
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        try {
            const decode = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decode;
            console.log(req.user, "this")
        }
        catch (error) {
            return res.status(401).json({
                success: false,
                error: error.message,
                message: 'Invalid Token'
            });
        }
        next();
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message,
            message: 'Something went wrong while validating the token'
        });
    }
}

exports.logIP = async (req, res, next) => {
    const ip = req.ip;
    const { _id } = req.user;

    try {
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if IP is already in the user's IP array
        if (!user.ip.includes(ip)) {
            user.ip.push(ip);
            await user.save();
        }

        next();
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};