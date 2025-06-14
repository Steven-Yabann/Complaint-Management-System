const Department = require('../models/department');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async'); // Assuming you have this for error handling

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private (users must be logged in to access this list)
exports.getDepartments = asyncHandler(async (req, res, next) => {
    const departments = await Department.find();

    res.status(200).json({
        success: true,
        count: departments.length,
        data: departments
    });
});

// @desc    Create new department (for admin use, not exposed to normal users usually)
// @route   POST /api/departments
// @access  Private (Admins only)
exports.createDepartment = asyncHandler(async (req, res, next) => {
    // In a real app, you'd add role-based access control here (e.g., req.user.role === 'admin')
    const department = await Department.create(req.body);

    res.status(201).json({
        success: true,
        data: department
    });
});

