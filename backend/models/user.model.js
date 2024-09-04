const mongoose = require("mongoose");
const uniqueValidator = require('mongoose-unique-validator')

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    geoCoordinates: {
        latitude: {
            type: String
        },
        longitude: {
            type: String
        }
    },
    phone: {
        type: Number,
        unique: true
    },
    profilePic: {
        type: String
    },
    address: [{
        houseNo: {
            type: String
        },
        streetAddress: {
            type: String
        },
        city: {
            type: String
        },
        state: {
            type: String
        },
        pincode: {
            type: String
        }
    }],
    status: {
        type: String  //active and inactive 
    },
    orders: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Order'
    }],
    tempMail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    emailVerifyFlag: {
        type: Boolean,
        default: false
    },
    lastLogin: {
        type: String
    },
    ip: [{
        type: String
    }],
    createdOn: {
        type: Date,
        default: () => new Date(Date.now() + 5.5 * 60 * 60 * 1000)
    }
}, { versionKey: false });

module.exports = mongoose.model("User", UserSchema);