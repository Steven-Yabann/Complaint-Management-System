// Backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user by ID from token
        req.user = await User.findById(decoded.user.id);

        if (!req.user) {
            return next(new ErrorResponse('No user found with this ID', 404));
        }

        next();
    } catch (err) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});

// Authorize roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
        }
        next();
    };
};

// Enhanced authorize for admin routes that require department assignment
exports.authorizeAdminWithDepartment = () => {
    return (req, res, next) => {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return next(new ErrorResponse('User role is not authorized to access this route', 403));
        }

        // Check if admin has a department ObjectId assigned
        if (!req.user.department) {
            return next(new ErrorResponse('Admin user does not have a department assigned. Please contact system administrator.', 400));
        }

        next();
    };
};