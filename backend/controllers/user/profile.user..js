const asyncHandler = require("../../middlewares/user/async");
const User = require("../../models/user.model");
const Verification = require('../../models/email.model')
const verificationEmailTemplate = require("../../tempelates/verifyMail");
const fs = require('fs');
const path = require('path');

exports.addAddress = asyncHandler(async (req, res) => {
    const { houseNo, streetAddress, city, state, pincode } = req.body;
    const { userId } = req.user;

    if (!houseNo || !streetAddress || !city || !state || !pincode) {
        return res.status(400).json({
            message: "Please provide all the required details"
        });
    }

    const user = await User.findByIdAndUpdate(
        userId,
        {
            $push: {
                address: {
                    houseNo,
                    streetAddress,
                    city,
                    state,
                    pincode
                }
            }
        },
        { new: true }
    );

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    res.status(200).json({
        message: "Address added successfully",
        user
    });
});

exports.updateAddress = asyncHandler(async (req, res) => {
    const { addressId, houseNo, streetAddress, city, state, pincode } = req.body;
    const { userId } = req.user;

    if (!addressId || !houseNo || !streetAddress || !city || !state || !pincode) {
        return res.status(400).json({
            message: "Please provide all the required details"
        });
    }

    const user = await User.findOneAndUpdate(
        { _id: userId, "address._id": addressId },
        {
            $set: {
                "address.$.houseNo": houseNo,
                "address.$.streetAddress": streetAddress,
                "address.$.city": city,
                "address.$.state": state,
                "address.$.pincode": pincode
            }
        },
        { new: true }
    );

    if (!user) {
        return res.status(404).json({
            message: "User or address not found"
        });
    }

    res.status(200).json({
        message: "Address updated successfully",
        user
    });
});

exports.updateLoaction = asyncHandler(async (req, res) => {
    const { latitude, longitude } = req.body;
    console.log(req.user)
    const { userId } = req.user

    if (!latitude || !longitude) {
        return res.status(400).json({
            message: "Please provide both latitude and longitude"
        });
    }

    const user = await User.findByIdAndUpdate(
        userId,
        {
            'geoCoordinates.latitude': latitude,
            'geoCoordinates.longitude': longitude
        },
        { new: true } // Return the updated document
    );

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    res.status(200).json({
        message: "Location updated successfully",
        user
    });
})

exports.updateProfile = asyncHandler(async (req, res) => {
    const { name, email, profilePic } = req.body;
    const { userId } = req.user;

    let updateFields = {};
    if (name) updateFields.name = name;
    if (profilePic) {
        const profilePicPath = await saveProfilePic(profilePic);
        updateFields.profilePic = profilePicPath;
    }
    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    if (email && email !== user.email) {
        updateFields.tempMail = email;
        updateFields.emailVerifyFlag = false;

        // Send verification email
        const verificationToken = crypto.randomBytes(20).toString('hex');
        const verificationLink = `${req.protocol}://${req.get('host')}/client/api/verify-email?token=${verificationToken}`;
        const emailContent = verificationEmailTemplate(verificationLink);
        await mailSender(email, 'Verify your new email address', emailContent);

        const expirationTime = new Date();
        expirationTime.setMinutes(expirationTime.getMinutes() + 30);
        const verify = await Verification.create({
            userId: user._id,
            token: verificationToken,
            expiresAt: expirationTime
        })
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true }
    );

    res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser
    });
});

async function saveProfilePic(data) {
    if (!data) {
        return null;
    }

    const DocsDir = path.join(process.env.FILE_SAVE_PATH, 'ProfilePics');

    if (!fs.existsSync(DocsDir)) {
        fs.mkdirSync(DocsDir, { recursive: true });
    }

    const picBuffer = Buffer.from(data, 'base64');
    const picFilename = `${uuidv4()}.jpg`;
    const picPath = path.join(DocsDir, picFilename);

    fs.writeFileSync(picPath, picBuffer);

    return picPath;
}
