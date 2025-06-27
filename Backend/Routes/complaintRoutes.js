// backend/Routes/complaintRoutes.js

const express = require('express');
const router = express.Router();
// Import your authentication and authorization middleware
const { protect, authorize, authorizeAdminWithDepartment } = require('../middleware/auth');

// Import your complaint controller functions
const {
    createComplaint,
    getUserComplaints,
    getComplaint,
    updateComplaint,
    deleteComplaint,
    getAllComplaintsForAdmin
} = require('../controllers/complaintController');

// --- User-specific complaint routes ---
router.route('/')
    .post(protect, createComplaint);

router.route('/me')
    .get(protect, getUserComplaints);

// --- Admin-specific complaint routes ---
// Route to get all complaints for the admin dashboard (now filtered by department)
router.route('/admin/all')
    .get(protect, authorizeAdminWithDepartment(), getAllComplaintsForAdmin);

// --- Routes for specific complaints by ID (common for both users and admins) ---
router.route('/:id')
    .get(protect, getComplaint)
    .put(protect, updateComplaint)
    .delete(protect, deleteComplaint);

module.exports = router;