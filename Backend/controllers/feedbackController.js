// backend/controllers/feedbackController.js
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');

// @desc    Submit feedback for a specific complaint
// @route   POST /api/feedback
// @access  Private (User)
exports.submitFeedback = async (req, res) => {
    // These values come from the frontend (FeedbackModal.jsx)
    const { complaintId, rating, description, notificationId } = req.body;

    // Basic validation
    if (!complaintId || !rating) {
        return res.status(400).json({ success: false, message: 'Complaint ID and rating are required.' });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    try {
        // The user ID comes from req.user.id, populated by the 'protect' middleware
        const userId = req.user.id; 
        console.log(`[submitFeedback] User ID from token (req.user.id): ${userId}`); // Debug log

        // Ensure the complaint exists and belongs to the authenticated user
        const complaint = await Complaint.findOne({ _id: complaintId, user: userId });
        if (!complaint) {
            console.error(`[submitFeedback] Complaint not found or not authorized for user ${userId} with complaint ID ${complaintId}`); // Debug log
            return res.status(404).json({ success: false, message: 'Complaint not found or not authorized to give feedback.' });
        }

        // Check if feedback already exists for this complaint by this user
        // Use 'submittedBy' here to match your Feedback model schema
        const existingFeedback = await Feedback.findOne({ submittedBy: userId, complaint: complaintId });
        if (existingFeedback) {
            console.warn(`[submitFeedback] Feedback already exists for complaint ${complaintId} by user ${userId}.`); // Debug log
            return res.status(409).json({ success: false, message: 'Feedback already provided for this complaint.' });
        }

        // Create new feedback instance
        const newFeedback = new Feedback({
            submittedBy: userId, // <<<--- CRITICAL FIX: Changed from 'user' to 'submittedBy'
            complaint: complaintId,
            rating,
            comments: description, // Use 'comments' to match your Feedback model schema
        });

        await newFeedback.save();
        console.log('SUCCESS: Feedback saved:', newFeedback); // Debug log

        // Mark the corresponding notification as feedbackGiven: true
        if (notificationId) {
            await Notification.findOneAndUpdate(
                { _id: notificationId, user: userId, complaint: complaintId }, // Note: Notification model uses 'user' for recipient
                { $set: { feedbackGiven: true } },
                { new: true } // Return the updated notification document
            );
            console.log(`SUCCESS: Notification ${notificationId} marked as feedbackGiven.`); // Debug log
        }

        res.status(201).json({ success: true, data: newFeedback, message: 'Feedback submitted successfully!' });

    } catch (error) {
        console.error('ERROR: Failed to submit feedback:', error); // Log full error object
        // Mongoose validation errors (e.g., if rating is out of range, though we have client-side validation)
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({ success: false, message: `Validation Error: ${errors.join(', ')}` });
        }
        // Duplicate key error (though we also check for existing feedback manually)
        if (error.code === 11000) { 
            return res.status(409).json({ success: false, message: 'Feedback already provided for this complaint (duplicate entry).' });
        }
        res.status(500).json({ success: false, message: 'Server error submitting feedback.' });
    }
};

// @desc    Get all feedback (for admin analytics)
// @route   GET /api/feedback/analytics
// @access  Private (Admin)
exports.getAnalyticsFeedback = async (req, res) => {
    // Ensure only admins can access this route (authorize middleware should handle this)
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }

    try {
        const feedback = await Feedback.find()
            .populate({
                path: 'submittedBy', // Populate the 'submittedBy' field
                select: 'username email'
            })
            .populate({
                path: 'complaint',
                select: 'title status createdAt'
            })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: feedback });
    } catch (error) {
        console.error('Error fetching analytics feedback:', error);
        res.status(500).json({ success: false, message: 'Server error fetching feedback for analytics.' });
    }
};
