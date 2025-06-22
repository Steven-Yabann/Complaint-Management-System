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