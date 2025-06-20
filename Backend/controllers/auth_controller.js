// backend/Routes/auth_controller.js

const User = require('../models/User.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- Correct

// Helper function to sign a JWT token - MODIFIED to include userCategory
const generateToken = (id, userCategory) => { // ADD userCategory parameter
    return jwt.sign(
        { id, role: userCategory }, // Include 'role' in the payload with userCategory value
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

exports.loginUser = async (req, res) => {
    console.log("Received login data: ", req.body);
    const { admissionNumber, password } = req.body;

    try {
        // Find user with ADM no
        const user = await User.findOne({ admissionNumber: admissionNumber.trim() });

        if (!user) {
            return res.status(400).json({ message: "Invalid admission number or password" });
        }

        // Check password using bcrypt.compare
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid admission number or password" });
        }

        // Generate JWT token - MODIFIED to pass user.userCategory
        const token = generateToken(user._id, user.userCategory); // Pass user.userCategory to generateToken

        // If valid, return user data AND the token
        const userData = {
            id: user._id,
            adm_no: user.admissionNumber,
            email: user.email,
            fname: user.first_name,
            lname: user.last_name,
            username: user.username,
            user_cat: user.userCategory // This is the role, good to keep it here too for client-side direct access if needed
        };

        // It's also a good idea to send the role directly in the response for immediate use
        res.status(200).json({ message: "Login successful", userData, token, role: user.userCategory }); // ADD role to the direct response

    } catch (err) {
        console.log("Login error", err);
        res.status(500).json({ message: "Server error", error: err });
    }
};