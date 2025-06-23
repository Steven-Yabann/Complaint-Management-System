// Add these routes to your Backend/Routes/complaint_router.js

const express = require('express');
const { 
    createComplaint, 
    getUserComplaints, 
    getComplaint, 
    updateComplaint, 
    deleteComplaint, 
    getAllComplaints, 
    updateComplaintStatus 
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

// User routes
router.route('/').post(protect, createComplaint);
router.route('/me').get(protect, getUserComplaints);

// Admin routes - get all complaints
router.route('/admin/all').get(protect, authorize('admin'), getAllComplaints);

// Admin routes - update complaint status
router.route('/:id/status').put(protect, authorize('admin'), updateComplaintStatus);

// Routes for specific complaints
router.route('/:id')
    .get(protect, getComplaint)
    .put(protect, updateComplaint)
    .delete(protect, deleteComplaint);

module.exports = router;