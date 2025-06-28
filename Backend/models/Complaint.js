// backend/models/Complaint.js

const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    title: {
        type: String,
        required: [true, 'Please add a complaint title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department', 
        required: [true, 'Please select a department/building']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [500, 'Description cannot be more than 500 characters'] 
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open'
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        default: 'Low'
    },
    attachments: [
        {
            filename: String,
            filepath: String, // Path where the file is stored on the server
            mimetype: String
        }
    ],
    seen: {
        type: Boolean,
        default: false
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

// Update 'updatedAt' field on save
ComplaintSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Complaint', ComplaintSchema);