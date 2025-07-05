// backend/routes/auth_routes.js

const express = require('express');
const router = express.Router();

// Import all authentication-related controller functions.
// Ensure this path is correct relative to auth_routes.js.
const {
    loginUser,
    registerUser,
    verifyEmail,
    resendOtp,
    // NEW: Import the forgotPassword and resetPassword functions
    forgotPassword,
    resetPassword
} = require('../controllers/authController'); // Make sure these functions are defined in authController.js

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

// --- NEW: Routes for Forgot and Reset Password ---

// @route   POST /api/auth/forgot-password
// @desc    Request a password reset (sends OTP to email)
// @access  Public
router.post('/forgot-password', forgotPassword);

// @route   POST /api/auth/reset-password/:otp
// @desc    Reset password using the provided OTP and new password
// @access  Public
router.post('/reset-password/:otp', resetPassword);

module.exports = router;