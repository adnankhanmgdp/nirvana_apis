const bcrypt = require("bcryptjs");
const crypto = require('crypto')
const jwt = require("jsonwebtoken");
const User = require('../../models/user.model');
const Verification = require('../../models/email.model')
const asyncHandler = require('../../middlewares/user/async')
const { generateOTP } = require('../../utils/generateOTP');
const verificationEmailTemplate = require("../../tempelates/verifyMail");
const mailSender = require("../../utils/mailSender");
const registrationConfirmationTemplate = require("../../tempelates/registrationConfirmed");

exports.sendOTP = asyncHandler(async (req, res) => {
    const { phone, name, email } = req.body;
    if (!name || !phone || !email) {
        return res.json({
            message: "Please provide all the details"
        })
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (!emailRegex.test(email)) {
        return res.json({
            message: "Please provide a valid email"
        });
    }


    const checkUserByPhone = await User.findOne({ phone });
    const checkUserByEmail = await User.findOne({ email });

    if (checkUserByPhone) {
        return res.json({
            message: 'User with this phone number is already registered'
        });
    }

    if (checkUserByEmail) {
        return res.json({
            message: 'User with this email is already registered'
        });
    }

    const otp = crypto.randomInt(100000, 999999);
    // sendOTP(otp, phone);
    console.log(otp)
    const token = jwt.sign(
        { phone, name, email, otp },
        process.env.JWT_SECRET,
        {
            expiresIn: "5m",
        }
    );

    res.json({
        message: 'OTP send successfully',
        token
    })
});

exports.verifyOTP = asyncHandler(async (req, res) => {
    const { otp } = req.body;
    const { token } = req.headers;
    console.log(token)

    if (!token || !otp) {
        return res.status(400).json({ message: 'Token and OTP are required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { phone, otp: tokenOTP, name, email } = decoded;

    if (otp !== tokenOTP) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Check if the user already exists
    let user = await User.findOne({ phone });

    if (user) {
        return res.status(400).json({ message: 'User already registered' });
    }

    // Create the user
    user = new User({ phone, name, email });

    // Send registration confirmation email
    const emailBody = registrationConfirmationTemplate(user.name);
    await mailSender(user.email, 'Registration Confirmation', emailBody);

    await user.save();

    // Create a persistent token
    const persistentToken = jwt.sign(
        { userId: user._id, phone: user.phone },
        process.env.JWT_SECRET
    );

    res.status(201).json({
        message: 'User created successfully',
        token: persistentToken,
        user
    });
});

exports.resendOTP = asyncHandler(async (req, res) => {
    const { token } = req.headers;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { phone, name, email } = decoded;

        const otp = crypto.randomInt(100000, 999999);
        // sendOTP(otp, phone);
        console.log(otp);

        const newToken = jwt.sign(
            { phone, name, email, otp },
            process.env.JWT_SECRET,
            {
                expiresIn: "5m",
            }
        );

        res.json({
            message: 'OTP resent successfully',
            token: newToken
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'Token has expired. Please request a new OTP.' });
        }
        res.status(400).json({ message: 'Invalid token', error: error.message });
    }
});

exports.login = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({ phone });

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const otp = crypto.randomInt(100000, 999999);
    // sendOTP(otp, phone);
    console.log(otp);

    const token = jwt.sign(
        { phone, otp },
        process.env.JWT_SECRET,
        {
            expiresIn: "5m",
        }
    );

    res.json({
        message: 'OTP sent successfully',
        token
    });
});

exports.verifyLoginOTP = asyncHandler(async (req, res) => {
    const { token } = req.headers
    const { otp } = req.body;

    if (!token || !otp) {
        return res.status(400).json({ message: 'Token and OTP are required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { phone, otp: tokenOTP } = decoded;

        if (otp !== tokenOTP) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate a new auth token (no expiry unless logged out)
        const authToken = jwt.sign(
            { userId: user._id, phone: user.phone },
            process.env.JWT_SECRET
        );

        res.json({
            message: 'Login successful',
            token: authToken,
            user
        });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(400).json({ message: 'OTP has expired' });
        }
        res.status(400).json({ message: 'Invalid token', error: error.message });
    }
});

exports.sendVerificationEmail = async (req, res) => {
    const { token } = req.headers;

    try {
        // Find the user by email (assuming you have a User model)
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ phone: decoded.phone });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const verificationEntry = await Verification.findOne({ userId: user._id });
        if (verificationEntry) {
            await Verification.deleteOne({ userId: user._id });
        }

        // Generate a verification token
        const verificationToken = crypto.randomBytes(20).toString('hex');

        // Calculate expiration time (30 minutes from now)
        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 30);
        const verify = await Verification.create({
            userId: user._id,
            token: verificationToken,
            expiresAt: expirationTime
        })

        // Construct the verification link
        const verificationLink = `${req.protocol}://${req.get('host')}/client/api/verify-email?token=${verificationToken}`;
        console.log(verificationLink)

        // Send verification email
        const emailBody = verificationEmailTemplate(verificationLink);
        await mailSender(user.email, 'Email Verification', emailBody);

        res.json({ message: 'Verification email sent' });
    } catch (error) {
        console.error('Error sending verification email:', error);
        res.status(500).json({ message: 'Failed to send verification email' });
    }
};

exports.verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        // Find verification entry by token
        const verificationEntry = await Verification.findOne({ token });

        if (!verificationEntry) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        // Check token expiration
        if (verificationEntry.expiresAt < new Date()) {
            return res.status(400).json({ message: 'Token has expired' });
        }

        // Find user by ID and mark email as verified
        const user = await User.findByIdAndUpdate(verificationEntry.userId, { emailVerifyFlag: true });

        // Delete verification entry after successful verification
        await Verification.deleteOne({ token });

        res.json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Failed to verify email' });
    }
};