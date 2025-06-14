const jwt = require('jsonwebtoken');
const express = require('express');
const {loginUser} = require('../controllers/auth_controller');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User'); 

require('dotenv').config({ path: '../config.env' });
const JWT_SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
       //check if user exists
        let userByUsername = await User.findOne({ username });
        if (userByUsername) {
            return res.status(409).json({ message: 'Username taken. Please use a different username.' });
        }

        let userByEmail = await User.findOne({ email });
         if (userByEmail) {
             return res.status(409).json({ message: 'Email already registered. Please use a different email.' });
         }


        //hash password
        const salt = await bcrypt.genSalt(10); 
        const hashedPassword = await bcrypt.hash(password, salt); 

        // 4. Create a new User instance
        const newUser = new User({
            username,
            email,
            password: hashedPassword 
        });

        // 5. Save the user to the database
        await newUser.save();

        // 6. Respond with success
        res.status(201).json({ message: 'User registered successfully!' });

    } catch (err) {
        console.error("Registration error:", err.message);
        // More detailed error handling might be needed based on Mongoose validation errors etc.
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
        let user = await User.findOne({
            $or: [{ username: username }, { email: username }] // Allow login with either username or email
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }

        // Compare provided password with hashed password in DB
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials.' });
        }

        // User is authenticated, create and return a JWT
        // The payload usually contains the user ID and potentially username/email
        const payload = {
            user: {
                id: user.id, // Mongoose creates an .id getter for _id
                username: user.username
                
            }   
        };

        // Sign the token
        jwt.sign(
            payload,
            JWT_SECRET, // Your secret key
            { expiresIn: '1h' }, // Token expires in 1 hour (adjust as needed)
            (err, token) => {
                if (err) throw err;
                res.json({ message: 'Login successful!', token }); // Send token back to frontend
            }
        );

    } catch (err) {
        console.error("Login error:", err.message);
        res.status(500).json({ message: 'Server error during login. Please try again later.' });
    }
});
module.exports = router;