const mongoose = require('mongoose')

const MerchantSchema = new mongoose.Schema({
    name: {
        type: String
    },
    businessName: {
        type: String
    },
    businessAddress: [{
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
    profilePic: {
        type: String
    },
    doc: {
        type: String
    },
    docType: {
        type: String
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
        type: Number
    },
    status: {
        type: String  //active and inactive 
    },
    verificationStatus: {
        type: String
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
    copyflag: {
        type: Boolean
    },
    approvalStatus: {
        status: {
            type: String
        },
        notes: {
            type: String
        }
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
}, { versionKey: false })

module.exports = mongoose.model("Merchant", MerchantSchema);