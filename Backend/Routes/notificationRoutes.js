const express = require('express');
const { getNotifications, markAsRead, getUnreadCount } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth'); // Your authentication middleware

const router = express.Router();

// Get all notifications for the authenticated user
router.get('/me', protect, getNotifications);

// Mark a specific notification as read
router.put('/:id/read', protect, markAsRead);

// Get count of unread notifications for the authenticated user
router.get('/unread/count', protect, getUnreadCount);

module.exports = router;