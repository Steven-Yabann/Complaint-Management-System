const mongoose = require('mongoose');

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
        unique: true, // Emails must be unique
        trim: true,
        lowercase: true, // Store emails in lowercase for consistency
        match: [/.+@.+\..+/, 'Please use a valid email address']
    },
    password: {
        type: String,
        required: true,
        minlength: 6 
    },
    role: { 
        type: String,
        enum: ['user', 'admin'], // Define allowed roles
        default: 'user'
    },
    department: { // come and redo this 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department', // This must match the model name export in Department.js
        required: false // A user might not always be assigned to a department initially, or if they are a general user
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);