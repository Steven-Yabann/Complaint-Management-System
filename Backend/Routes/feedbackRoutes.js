const express = require('express');
const { submitFeedback, getAnalyticsFeedback } = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth'); // Your authentication middleware

const router = express.Router();

// Submit feedback for a complaint
router.post('/', protect, submitFeedback);

// Get all feedback for analytics (Admin only)
router.get('/analytics', protect, getAnalyticsFeedback); // You might want an adminAuth middleware here

module.exports = router;
