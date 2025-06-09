const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    submittedBy: { // Reference to the User who submitted the feedback
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: { // e.g., 1-5 stars
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    complaint: { // Reference to the Complaint this feedback is for
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        required: true
    },
    comments: {
        type: String,
        required: false, // Comments can be optional
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);