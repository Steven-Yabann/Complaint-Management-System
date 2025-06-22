// backend/Routes/complaintRoutes.js

const express = require('express');
const { 
    createComplaint, 
    getUserComplaints, 
    getComplaint, 
    updateComplaint, 
    deleteComplaint 
} = require('../controllers/complaintController');
const { 
    getAllComplaints, 
    updateComplaintStatus 
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// User routes
router.route('/').post(protect, createComplaint);
router.route('/me').get(protect, getUserComplaints);

// Admin routes - moved to use adminController
router.route('/admin/all').get(protect, authorize('admin'), getAllComplaints);
router.route('/:id/status').put(protect, authorize('admin'), updateComplaintStatus);

// Routes for specific complaints (user access)
router.route('/:id')
    .get(protect, getComplaint)
    .put(protect, updateComplaint)
    .delete(protect, deleteComplaint);

module.exports = router;