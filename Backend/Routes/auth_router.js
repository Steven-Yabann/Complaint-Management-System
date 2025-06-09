const express = require('express');
const {loginUser} = require('../Controller/auth_controller');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user_model'); 

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
       //check if user exists
        let userByEmail = await User.findOne({ email });
        if (userByEmail) {
            return res.status(409).json({ message: 'Email already exists. Please use a different email.' });
        }

        
        let userByUsername = await User.findOne({ username });
        if (userByUsername) {
            return res.status(409).json({ message: 'Username already taken. Please choose a different username.' });
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

module.exports = router;