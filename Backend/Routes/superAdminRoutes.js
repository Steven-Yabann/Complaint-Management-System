// Backend/Routes/superAdminRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
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
	resetUserPassword
} = require('../controllers/superAdminController');

// Protect all routes and authorize only super admin
router.use(protect);
router.use(authorize('superadmin'));

// User Management Routes
router.route('/users')
	.get(getAllUsers);

router.route('/create-admin')
	.post(createAdmin);

router.route('/users/:id')
	.put(updateUser)
	.delete(deleteUser);

router.route('/users/:id/reset-password')
	.post(resetUserPassword);

// Department Management Routes
router.route('/departments')
	.get(getAllDepartments)
	.post(createDepartment);

router.route('/departments/:id')
	.put(updateDepartment)
	.delete(deleteDepartment);

// System Statistics
router.route('/stats')
	.get(getSystemStats);

module.exports = router;