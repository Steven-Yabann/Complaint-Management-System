// backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Make sure you have bcryptjs installed: npm install bcryptjs

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    // New fields for 2FA/Password Reset OTP
    otp: {
        type: String,
        default: null // Stores the OTP sent to the user
    },
    otpExpires: {
        type: Date,
        default: null // Stores the expiry time for the OTP
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware to hash the password before saving
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password in the database
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);