const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipient: { // Reference to the User who receives the notification
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    relatedComplaint: { // Optional: Reference to the Complaint related to the notification
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        required: false, // A notification might not always be complaint-specific
        default: null
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', NotificationSchema);