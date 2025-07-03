// Backend/middleware/auth.js (Updated to include superadmin role)

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check if token is in headers (Bearer Token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // If no token, user is not authorized
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route (No token)', 401));
    }

    try {
        // Verify token using your JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Access the user ID directly from the decoded payload.
        req.user = await User.findById(decoded.id); 

        if (!req.user) {
            return next(new ErrorResponse('No user found with this ID', 404));
        }

        // If user is found, proceed to the next middleware/route handler
        next();
    } catch (err) {
        // If token verification fails (e.g., expired, invalid signature)
        return next(new ErrorResponse('Not authorized to access this route (Invalid token)', 401));
    }
});

// Authorize roles (e.g., exports.authorize('admin', 'superadmin'))
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // req.user.role should be populated by the 'protect' middleware
        if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
            return next(new ErrorResponse(`User role ${req.user.role || 'unspecified'} is not authorized to access this route`, 403));
        }
        next();
    };
};

// Enhanced authorize for admin routes that require department assignment
exports.authorizeAdminWithDepartment = () => {
    return (req, res, next) => {
        // Check if user is admin
        if (!req.user || req.user.role !== 'admin') {
            return next(new ErrorResponse('User role is not authorized to access this route', 403));
        }

        // Check if admin has a department ObjectId assigned
        if (!req.user.department) {
            return next(new ErrorResponse('Admin user does not have a department assigned. Please contact system administrator.', 400));
        }

        next();
    };
};

// Super Admin specific middleware
exports.authorizeSuperAdmin = () => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== 'superadmin') {
            return next(new ErrorResponse('Super admin access required', 403));
        }
        next();
    };
};