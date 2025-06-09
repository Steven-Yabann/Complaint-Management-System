const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    submittedBy: { // Reference to the User who submitted the complaint
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: { // Reference to the User (staff) who is assigned the complaint
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Optional: might not be assigned immediately
        default: null
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    status: { // e.g., 'Pending', 'In Progress', 'Resolved', 'Closed', 'Rejected'
        type: String,
        enum: ['Pending', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
        default: 'Pending'
    },
    priority: { // e.g., 'Low', 'Medium', 'High', 'Urgent'
        type: String,
        enum: ['low', 'Medium', 'High', 'Urgent'],
        default: 'Medium'
    },
    attachments: { // Array of strings (e.g., URLs to uploaded files)
        type: [String],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update `updatedAt` whenever the document is updated
ComplaintSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Complaint', ComplaintSchema);