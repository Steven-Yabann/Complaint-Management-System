// backend/controllers/notificationController.js

const Notification = require('../models/Notification'); // Ensure this path is correct
const Complaint = require('../models/Complaint'); // To populate complaint details for feedback

// @desc    Create a new notification
// @param   {string} userId - ID of the user to notify
// @param   {string} complaintId - ID of the associated complaint (optional, but needed for status updates)
// @param   {string} message - The notification message
// @param   {string} type - Type of notification (e.g., 'statusUpdate', 'newFeedback')
// @access  Internal (called by other controllers)
exports.createNotification = async (userId, complaintId, message, type) => {
    try {
        console.log(`[createNotification] Attempting to create notification for userId: ${userId}, complaintId: ${complaintId}, type: ${type}`);

        // Fetch complaint details to store them directly or confirm existence (optional but good for consistency)
        let complaintDetails = null;
        if (complaintId) {
            complaintDetails = await Complaint.findById(complaintId).select('title status'); 
            if (!complaintDetails) {
                console.warn(`[createNotification] Complaint with ID ${complaintId} not found. Notification will be created without complaint details.`);
            }
        }

        const notification = await Notification.create({
            user: userId, // This now correctly matches the 'user' field in the Notification model
            complaint: complaintId || null, // This now correctly matches the 'complaint' field in the Notification model
            message,
            type, // This now correctly matches the 'type' field in the Notification model
            isRead: false, 
            feedbackGiven: false // This now correctly matches the 'feedbackGiven' field in the Notification model
        });
        console.log('SUCCESS: Notification created:', notification);
        return notification;
    } catch (error) {
        console.error('ERROR: Failed to create notification:', error.message, error.stack);
        throw error;
    }
};

// @desc    Get notifications for the authenticated user
// @route   GET /api/notifications/me
// @access  Private (User)
exports.getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({ user: req.user.id }) // Still uses 'user' for filtering
            .populate('complaint', 'title status _id') // Populates the 'complaint' field
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error.message, error.stack);
        next(error);
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private (User)
exports.markAsRead = async (req, res, next) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.id;

        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, user: userId }, 
            { isRead: true },
            { new: true } 
        );

        if (!notification) {
            return next(new ErrorResponse('Notification not found or not authorized to update.', 404));
        }

        res.status(200).json({
            success: true,
            message: 'Notification marked as read.',
            data: notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error.message, error.stack);
        next(error);
    }
};

// @desc    Get unread notification count for the authenticated user
// @route   GET /api/notifications/unread/count
// @access  Private (User)
exports.getUnreadCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({ user: req.user.id, isRead: false });

        res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error fetching unread notification count:', error.message, error.stack);
        next(error);
    }
};
