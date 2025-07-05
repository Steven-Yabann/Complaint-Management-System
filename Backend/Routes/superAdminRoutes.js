const express = require('express');
const {
	getAllUsers,
	createAdmin,
	updateUser,
	deleteUser,
	getAllDepartments,
	createDepartment,
	updateDepartment,
	deleteDepartment,
	getSystemStats,
	getAllComplaints,
	getFeedbackAnalytics,
	resetUserPassword
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('superadmin'));

// User management routes
router.route('/users')
	.get(getAllUsers);

router.route('/create-admin')
	.post(createAdmin);

router.route('/users/:id')
	.put(updateUser)
	.delete(deleteUser);

router.route('/users/:id/reset-password')
	.post(resetUserPassword);

// Department management routes
router.route('/departments')
	.get(getAllDepartments)
	.post(createDepartment);

router.route('/departments/:id')
	.put(updateDepartment)
	.delete(deleteDepartment);

// Analytics and statistics routes
router.route('/stats')
	.get(getSystemStats);

router.route('/complaints')
	.get(getAllComplaints);

router.route('/feedback-analytics')
	.get(getFeedbackAnalytics);

module.exports = router;