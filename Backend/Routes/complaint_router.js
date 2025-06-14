const express = require('express');
const { createComplaint, getUserComplaints } = require('../controllers/complaint_controller');
const { protect } = require('../middleware/auth'); // Import your authentication middleware
const router = express.Router();

router.route('/').post(protect, createComplaint);

//route for getting complaints for the logged in user 
router.route('/me').get(protect, getUserComplaints);

module.exports = router;