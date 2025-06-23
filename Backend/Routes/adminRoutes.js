// Backend/Routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
	getAdminProfile,
	updateAdminUsername,
	requestPasswordResetOTP,
	resetPasswordWithOTP,
	getAllComplaints,
	updateComplaintStatus,
	getDashboardStats,
	getComplaintById
} = require('../controllers/adminController');

// Admin Profile Routes
router.route('/profile')
	.get(protect, authorize('admin'), getAdminProfile);

router.route('/profile/username')
	.put(protect, authorize('admin'), updateAdminUsername);

// Admin Password Reset Routes (2FA)
router.route('/request-password-reset-otp')
	.post(protect, authorize('admin'), requestPasswordResetOTP);

router.route('/reset-password-with-otp')
	.post(protect, authorize('admin'), resetPasswordWithOTP);

// Admin Dashboard Routes
router.route('/dashboard/stats')
	.get(protect, authorize('admin'), getDashboardStats);

// Admin Complaint Management Routes
router.route('/complaints')
	.get(protect, authorize('admin'), getAllComplaints);

router.route('/complaints/:id')
	.get(protect, authorize('admin'), getComplaintById);

router.route('/complaints/:id/status')
	.put(protect, authorize('admin'), updateComplaintStatus);

module.exports = router;