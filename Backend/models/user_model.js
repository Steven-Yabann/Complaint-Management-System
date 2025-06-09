const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true, // Ensure usernames are unique
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure emails are unique
        match: [/.+@.+\..+/, 'Please use a valid email address'] // Basic email regex validation
    },
    password: {
        type: String,
        required: true,
        minlength: 6 // Enforce minimum password length
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);