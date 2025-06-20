const express = require('express');
const { getDepartments, createDepartment } = require('../controllers/departmentController');
const { protect } = require('../middleware/auth'); // Assuming your auth middleware is named 'protect'

const router = express.Router();

// All department routes will use the 'protect' middleware to ensure the user is logged in.
// If you want creating departments to be admin-only, you'd add more specific middleware.
router.route('/')
    .get(protect, getDepartments) // Get all departments (protected)
    .post(protect, createDepartment); // Create a new department (protected, potentially admin-only in future)

module.exports = router;