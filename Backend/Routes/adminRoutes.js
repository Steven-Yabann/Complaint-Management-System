// backend/Routes/adminRoutes.js

const express = require('express');
const { 
    getAllComplaints, 
    updateComplaintStatus, 
    getAdminProfile, 
    getDashboardStats, 
    getComplaintDetails, 
    markComplaintAsSeen 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// Admin profile route
router.route('/profile').get(protect, authorize('admin'), getAdminProfile);

// Dashboard statistics route
router.route('/dashboard/stats').get(protect, authorize('admin'), getDashboardStats);

// Complaint management routes
router.route('/complaints').get(protect, authorize('admin'), getAllComplaints);
router.route('/complaints/:id').get(protect, authorize('admin'), getComplaintDetails);
router.route('/complaints/:id/status').put(protect, authorize('admin'), updateComplaintStatus);
router.route('/complaints/:id/seen').put(protect, authorize('admin'), markComplaintAsSeen);

module.exports = router;