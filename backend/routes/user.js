const express = require("express")
const { sendOTP, verifyOTP, verifyLoginOTP, login, verifyEmail, resendOTP, sendVerificationEmail } = require("../controllers/user/auth.user")
const { auth } = require("../middlewares/user/auth")
const { updateLoaction } = require("../controllers/user/profile.user.")
const router = express.Router()

//auth
router.post("/sendOTP", sendOTP)
router.post("/verifyOTP", verifyOTP)
router.get("/resendOTP", resendOTP)
router.post("/login", login)
router.post("/verifyLoginOTP", verifyLoginOTP)
router.post("/sendVerificationEmail", sendVerificationEmail)
router.get("/verify-email", verifyEmail)

//profile
router.post("/location", auth, updateLoaction)

module.exports = { userRoutes: router }