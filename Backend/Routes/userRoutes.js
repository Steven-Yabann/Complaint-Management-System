// backend/routes/userRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth'); // Make sure this path is correct for your project
const User = require('../models/User');         // Make sure this path is correct for your project
const sendEmail = require('../utils/emailService'); // Make sure this path is correct for your project
const bcrypt = require('bcryptjs'); // Needed for password hashing if you decide to hash here directly again (but model pre-save is better)
const crypto = require('crypto');   // For generating OTP

// Important: Load dotenv at the application entry point (server.js/app.js), not in individual route files.
// Remove this line if you have dotenv.config() in your server.js
// require('dotenv').config({ path: '../config.env' });
// const JWT_SECRET = process.env.JWT_SECRET; // JWT_SECRET is typically used for signing tokens, not in userRoutes directly

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
// This route is called by your frontend's ProfilePage.jsx to get the current username and email.
router.get('/profile', protect, async (req, res) => {
    try {
        // req.user is populated by the protect middleware based on the JWT
        if (req.user) {
            res.json({
                username: req.user.username,
                email: req.user.email,
                // Add any other profile info you want to send
            });
        } else {
            // This case ideally shouldn't be hit if 'protect' middleware works correctly
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        res.status(500).json({ message: 'Server error fetching profile data.' });
    }
});

// @desc    Update username
// @route   PUT /api/users/profile/username
// @access  Private
router.put('/profile/username', protect, async (req, res) => {
    const { newUsername } = req.body;

    if (!newUsername || newUsername.trim().length < 3) {
        return res.status(400).json({ message: 'New username must be at least 3 characters long.' });
    }

    try {
        const user = req.user; // User from protect middleware

        // Check if username already exists for another user
        const usernameExists = await User.findOne({ username: newUsername });
        if (usernameExists && usernameExists._id.toString() !== user._id.toString()) {
            return res.status(400).json({ message: 'Username already taken.' });
        }

        user.username = newUsername;
        await user.save(); // User model's pre-save hook for password won't affect username update

        // Update username in localStorage on frontend after success
        // Not handled here, but this is the backend response for it
        res.json({ message: 'Username updated successfully!', username: user.username });
    } catch (error) {
        console.error("Error updating username:", error);
        res.status(500).json({ message: 'Server error during username update.' });
    }
});

// @desc    Request password reset OTP (2FA)
// @route   POST /api/users/request-password-reset-otp
// @access  Private (authenticated user requests for their own account)
router.post('/request-password-reset-otp', protect, async (req, res) => {
    try {
        const user = req.user; // User from protect middleware

        // Generate a 6-digit numeric OTP for simplicity
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP expiry (e.g., 10 minutes from now)
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes in milliseconds
        await user.save();

        const mailOptions = {
            to: user.email,
            subject: 'Your Password Reset OTP',
            html: `
                <p>Hello ${user.username},</p>
                <p>You recently requested to reset your password. Your One-Time Password (OTP) is:</p>
                <h3><strong>${otp}</strong></h3>
                <p>This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
                <p>If you did not request a password reset, please ignore this email.</p>
                <p>Thanks,<br>Your App Team</p>
            `,
        };

        await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);

        res.status(200).json({ message: 'OTP sent to your email.' });
    } catch (error) {
        console.error('Error in request-password-reset-otp:', error);
        res.status(500).json({ message: 'Failed to send OTP. Server error.' });
    }
});

// @desc    Reset password with OTP
// @route   POST /api/users/reset-password-with-otp
// @access  Private (authenticated user uses OTP for their own account)
router.post('/reset-password-with-otp', protect, async (req, res) => {
    const { otp, newPassword } = req.body; // Email is implied from req.user
                                        // Frontend might send it, but we use the authenticated user's email for security

    if (!otp || !newPassword) {
        return res.status(400).json({ message: 'Please provide OTP and new password.' });
    }

    try {
        const user = req.user; // User from protect middleware

        // Basic validation for new password strength
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
        }

        // Verify OTP and expiry
        if (!user.otp || user.otp !== otp || user.otpExpires < Date.now()) {
            // Clear OTP fields to prevent brute-forcing old OTPs
            // No need to save immediately, it will be saved after password update or on next request
            user.otp = null;
            user.otpExpires = null;
            await user.save(); // Save changes to invalidate OTP
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        user.password = newPassword;

        user.otp = null; // Clear OTP after successful use
        user.otpExpires = null;
        await user.save(); // Save the updated user with new password and cleared OTP fields

        res.status(200).json({ message: 'Password reset successfully! You will be logged out to re-login.' });

    } catch (error) {
        console.error('Error in reset-password-with-otp:', error);
        res.status(500).json({ message: 'Failed to reset password. Server error.' });
    }
});


// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
router.get('/admin/profile', protect, authorize('admin'), async (req, res) => {
    try {
        if (req.user) {
            res.json({
                username: req.user.username,
                email: req.user.email,
                role: req.user.role
            });
        } else {
            res.status(404).json({ message: 'Admin not found.' });
        }
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        res.status(500).json({ message: 'Server error fetching profile data.' });
    }
});

// OR create a separate admin routes file
// Backend/Routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private (Admin)
router.get('/profile', protect, authorize('admin'), async (req, res) => {
    try {
        if (req.user) {
            res.json({
                username: req.user.username,
                email: req.user.email,
                role: req.user.role
            });
        } else {
            res.status(404).json({ message: 'Admin not found.' });
        }
    } catch (error) {
        console.error("Error fetching admin profile:", error);
        res.status(500).json({ message: 'Server error fetching profile data.' });
    }
});


module.exports = router;