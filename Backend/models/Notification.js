// backend/models/Notification.js

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { // Changed from 'recipient' to 'user' to match controller convention
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    // Changed from 'relatedComplaint' to 'complaint' for simpler reference and consistency
    // with how it's populated and used in frontend.
    complaint: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint', // Reference to the Complaint model
        required: false, 
        default: null
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: { // Added 'type' field as it's used in createNotification and helps categorization
        type: String,
        enum: ['statusUpdate', 'feedbackReminder', 'newFeedback', 'system'], // Define types as per your application's needs
        default: 'system'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    feedbackGiven: { // Added 'feedbackGiven' field as it's used in frontend logic
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);
