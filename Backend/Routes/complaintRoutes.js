// backend/Routes/complaintRoutes.js

const express = require('express');
const router = express.Router();
// Import your authentication and authorization middleware
const { protect, authorize } = require('../middleware/auth'); // Ensure this path is correct: ../middleware/auth or ../middleware/authMiddleware

// Import your complaint controller functions
const {
    createComplaint,
    getUserComplaints,
    getComplaint,
    updateComplaint,
    deleteComplaint,
    getAllComplaintsForAdmin // Make SURE this name matches the export in complaint_controller.js
} = require('../controllers/complaintController'); // Path to your complaint controller

// --- User-specific complaint routes ---
router.route('/')
    .post(protect, createComplaint);

router.route('/me')
    .get(protect, getUserComplaints);

// --- Admin-specific complaint routes ---
// Route to get all complaints for the admin dashboard
router.route('/admin/all')
    .get(protect, authorize('admin'), getAllComplaintsForAdmin); // <-- This is where the function is used

// --- Routes for specific complaints by ID (common for both users and admins) ---
router.route('/:id')
    .get(protect, getComplaint)
    .put(protect, updateComplaint)
    .delete(protect, deleteComplaint);

module.exports = router;
