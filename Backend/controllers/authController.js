// backend/controllers/authController.js

const User = require('../models/User.js');
const bcrypt = require('bcryptjs'); // used foor hashing passwords
const jwt = require('jsonwebtoken');

// Helper function to sign a JWT token
const generateToken = (id, role, username) => { // Role and username are passed
    return jwt.sign(
        { id, role, username }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE } 
    );
};

// Function to handle user login
exports.loginUser = async (req, res) => {
    console.log("Received login data: ", req.body);
    const { username, password } = req.body; // Frontend sends 'username' and 'password'

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: "Please provide both username/email and password." });
    }

    try {
        // Find user by username OR email (case-insensitive for email)
        const user = await User.findOne({ 
            $or: [
                { username: username },
                { email: username.toLowerCase() } 
            ]
        }).select('+password'); // Explicitly select password to compare

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials." }); // Generic message for security
        }

        // Compare provided password with hashed password using the method from User model
        const isMatch = await user.matchPassword(password); 

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." }); // Generic message for security
        }

        // User is authenticated, generate JWT token
        // Use user.role directly from the User model
        const token = generateToken(user._id, user.role, user.username); 
        
        // Respond with success message, token, and relevant user info
        res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            username: user.username,
            role: user.role // Send the role for frontend routing and localStorage
        });

    } catch (err) {
        console.error("Login error:", err); 
        res.status(500).json({ message: "Server error during login. Please try again later." });
    }
};

//for registering a new user
exports.registerUser = async (req, res) => {
    const { username, email, password, role } = req.body; // Using 'role' to match model

    try {
        // Check if user exists by username or email
        let userByUsername = await User.findOne({ username });
        if (userByUsername) {
            return res.status(409).json({ message: 'Username is already taken.' });
        }

        let userByEmail = await User.findOne({ email });
        if (userByEmail) {
            return res.status(409).json({ message: 'Email is already registered.' });
        }

        // Create a new User instance
        const newUser = new User({
            username,
            email,
            password, 
            role: role || 'user' // automatically set to user, as admins are set manually
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (err) {
        console.error("Registration error:", err); 
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({ message: errors.join(', ') });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};
