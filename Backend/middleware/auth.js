// backend/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming your User model is here
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('./async'); // Need to import async handler here too

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }
    // If you were using cookies, you'd check req.cookies.token instead

    // Make sure token exists
    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        //was using this to check for token for loging and fetching departments 
        // console.log('Decoded user ID from token:', decoded.id);

        
        req.user = await User.findById(decoded.user.id);

        if (!req.user) {
            return next(new ErrorResponse('No user found with this ID', 404));
        }

        next(); // Proceed to the next middleware/route handler

    } catch (err) {
        // console.error(err); // For debugging: see JWT verification errors
        return next(new ErrorResponse('Not authorized to access this route', 401));
    }
});

// You can add authorize roles middleware here if you implement roles
// exports.authorize = (...roles) => {
//     return (req, res, next) => {
//         if (!roles.includes(req.user.role)) {
//             return next(new ErrorResponse(`User role ${req.user.role} is not authorized to access this route`, 403));
//         }
//         next();
//     };
// };