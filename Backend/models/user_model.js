const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    admissionNumber: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    userCategory: {
        type: String,
        required: true,
        enum: ['student', 'staff', 'admin'],
    }
}, {timestamps: true});

const User = mongoose.model('User', userSchema, 'User');

module.exports = User;