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
    deleteComplaint,
    getAllComplaintsForAdmin,
    // updateComplaintStatus, // <-- REMOVE THIS LINE, it no longer exists as a separate function
    updateComplaint // <-- ADD THIS LINE, as this function now handles all updates
} = require('../controllers/complaintController'); // Ensure this points to complaint_controller.js, not complaintController.js

// Import your Multer upload instance from the dedicated middleware file
const upload = require('../middleware/upload'); // <-- ADD THIS LINE. Make sure this path is correct based on where you put upload.js

// --- User-specific complaint routes ---
router.route('/')
    .post(protect, upload.array('attachments', 5), createComplaint); // <-- ADD upload middleware here

router.route('/me')
    .get(protect, getUserComplaints);

// --- Admin-specific complaint routes ---
// Route to get all complaints for the admin dashboard (now filtered by department)
router.route('/admin/all')
    .get(protect, authorizeAdminWithDepartment(), getAllComplaintsForAdmin);


// --- Routes for specific complaints by ID (common for both users and admins) ---
router.route('/:id')
    .get(protect, getComplaint)
    .put(protect, upload.array('attachments', 5), updateComplaint) // <-- CHANGE THIS: use updateComplaint and ADD upload middleware
    .delete(protect, deleteComplaint);


module.exports = router;