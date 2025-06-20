const express = require('express');
const { createComplaint, getUserComplaints,getComplaint, updateComplaint, deleteComplaint } = require('../controllers/complaint_controller');
const { protect } = require('../middleware/auth'); // Import your authentication middleware
const router = express.Router();

router.route('/').post(protect, createComplaint);

//route for getting complaints for the logged in user 
router.route('/me').get(protect, getUserComplaints);

//routes for updating and deleting
router.route('/:id')
    .get(protect,getComplaint)
    .put(protect, updateComplaint)
    .delete(protect, deleteComplaint);

module.exports = router;