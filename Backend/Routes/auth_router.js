// backend/routes/auth_routes.js (Corrected Register Route)

const jwt = require('jsonwebtoken');
const express = require('express');
// const {loginUser} = require('../controllers/auth_controller'); // <-- This seems unused, remove if not
const router = express.Router();
const bcrypt = require('bcryptjs'); // Still needed for the login route
const User = require('../models/User');

// Correct dotenv path if it's relative to auth_routes.js (better to load in server.js once)
// If your config.env is truly outside the backend folder's root, then this path might be fine
// but typically, .env is in the backend root and loaded in server.js
require('dotenv').config({ path: '../config.env' }); // Reconfirm if this path is correct for your setup
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user exists by username
        let userByUsername = await User.findOne({ username });
        if (userByUsername) {
            return res.status(409).json({ message: 'Username taken. Please use a different username.' });
        }

        // Check if user exists by email
        let userByEmail = await User.findOne({ email });
        if (userByEmail) {
            return res.status(409).json({ message: 'Email already registered. Please use a different email.' });
        }

        // --- REMOVE PASSWORD HASHING FROM HERE ---
        // The UserSchema.pre('save') middleware will handle hashing the password automatically.
        // const salt = await bcrypt.genSalt(10);
        // const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new User instance (pass the plain-text password)
        const newUser = new User({
            username,
            email,
            password // <--- Pass the plain-text password directly
        });

        // Save the user to the database (the pre-save hook will hash it here)
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (err) {
        console.error("Registration error:", err.message);
        // Mongoose validation errors (e.g., minlength) can also be caught here
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({ message: errors.join(', ') });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @route   POST /api/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { username, password } = req.body; // Assuming username or email will be sent for login

    try {
        // Find user by username or email
        // Note: For email, ensure it's converted to lowercase if your model stores it that way
        let user = await User.findOne({
            $or: [
                { username: username },
                { email: username.toLowerCase() } // Ensure email check is case-insensitive if needed
            ]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }

        // Compare provided password with hashed password in DB
        // user.matchPassword() (from your User model) is preferred for clarity and consistency
        const isMatch = await user.matchPassword(password); // Use the method from your User model

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }

        // User is authenticated, create and return a JWT
        const payload = {
            user: {
                id: user.id, // Mongoose creates an .id getter for _id
                username: user.username,
                email: user.email, // Include email in payload if needed by frontend
                role: user.role // Include role if you need it for authorization checks on frontend
            }
        };

        // Sign the token
        jwt.sign(
            payload,
            JWT_SECRET, // Your secret key
            { expiresIn: '1h' }, // Token expires in 1 hour (adjust as needed)
            (err, token) => {
                if (err) throw err;
                // Send token AND other user data needed by the frontend (like username)
                res.json({
                    message: 'Login successful!',
                    token,
                    username: user.username,
                    email: user.email,
                    role: user.role // Send role if needed by frontend
                });
            }
        );

    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: 'Server error during login. Please try again later.' });
    }
});

module.exports = router;