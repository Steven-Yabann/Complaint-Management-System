// backend/Routes/auth_router.js (or auth_controller.js, if you prefer to keep it separate)

const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- NEW: Import jsonwebtoken

// Helper function to sign a JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { // The payload will have { id: user._id }
        expiresIn: process.env.JWT_EXPIRE, // This will be defined in your config.env
    });
};

exports.loginUser = async (req, res) => {
    console.log("Received login data: ", req.body);
    const { admissionNumber, password } = req.body;

    try {
        // Find user with ADM no
        const user = await User.findOne({ admissionNumber: admissionNumber.trim() });

        if (!user) {
            return res.status(400).json({ message: "Invalid admission number or password" }); // Combine for security
        }

        // Check password using bcrypt.compare
        // NOTE: Your User model's pre-save hook should be hashing the password.
        // If it's not, you'll need to ensure passwords are hashed before saving to DB.
        // For now, assuming user.password is the hashed password.
        const isMatch = await bcrypt.compare(password, user.password); // <-- NEW: Use bcrypt for comparison

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid admission number or password" }); // Combine for security
        }

        // Generate JWT token
        const token = generateToken(user._id); // Generate token with user's _id

        // If valid, return user data AND the token
        const userData = {
            id: user._id,
            adm_no: user.admissionNumber,
            email: user.email,
            fname: user.first_name,
            lname: user.last_name,
            user_cat: user.userCategory
        };

        res.status(200).json({ message: "Login successful", userData, token }); // <-- NEW: Include token in response
    } catch (err) {
        console.log("Login error", err);
        res.status(500).json({ message: "Server error", error: err });
    }
};