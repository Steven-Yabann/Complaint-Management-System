// backend/routes/auth_routes.js

const express = require('express');
const router = express.Router();

// Import all authentication-related controller functions.
// Ensure this path is correct relative to auth_routes.js.
const { 
    loginUser, 
    registerUser, 
    verifyEmail,  // NEW: Import the email verification function
    resendOtp     // NEW: Import the resend OTP function
} = require('../controllers/authController');

// --- Public Routes for Authentication and Email Verification ---

// @route   POST /api/register
// @desc    Register a new user and send verification OTP
// @access  Public
router.post('/register', registerUser);

// @route   POST /api/login
// @desc    Authenticate user & get token (now checks for email verification)
// @access  Public
router.post('/login', loginUser);

// @route   POST /api/verify-email
// @desc    Verify user's email with OTP
// @access  Public
router.post('/verify-email', verifyEmail);

// @route   POST /api/resend-otp
// @desc    Resend email verification OTP
// @access  Public
router.post('/resend-otp', resendOtp);

module.exports = router;
