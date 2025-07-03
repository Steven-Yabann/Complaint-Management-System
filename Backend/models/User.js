// Backend/models/User.js (Updated to include superadmin role)

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'], // Added superadmin role
        default: 'user'
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: false
    },
    // Fields for 2FA/Password Reset OTP
    otp: {
        type: String,
        default: null
    },
    otpExpires: {
        type: Date,
        default: null
    },
    // Email verification
    isVerified: {
        type: Boolean,
        default: false
    },
    // Additional fields for super admin management
    lastLogin: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Will be set when created by super admin
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
    // 'this.password' will be available here because authController's login
    // explicitly uses .select('+password')
    return await bcrypt.compare(enteredPassword, this.password);
};

// --- NEW METHOD: To generate OTP and set its expiry ---
UserSchema.methods.generateEmailOTP = function() {
    // Generate a 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP expiry (e.g., 10 minutes from now)
    this.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds
    
    // Store the generated OTP on the user document
    this.otp = otp; 

    return otp; // Return the plain OTP to be sent via email
};


module.exports = mongoose.model('User', UserSchema);
