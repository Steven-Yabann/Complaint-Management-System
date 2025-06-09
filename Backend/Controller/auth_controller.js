const User = require('../models/User.js');
const bcrypt = require('bcrypt');


exports.loginUser = async (req, res) => {
    console.log("Received login data: ", req.body);
    const { admissionNumber, password } = req.body;

    try {
        const users = await User.find({});
        console.log("All users:", users);

        // Log admission number to verify the input
        console.log("Querying for user with admission number: ", admissionNumber);
        
        // Find user with ADM no
        const user = await User.findOne({ admissionNumber: admissionNumber.trim() });

        console.log("User: ", user);
        if (!user) {
            return res.status(400).json({ message: "Invalid admission number" });
        }

        // Check password
        const isMatch = password == user.password;
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid password" });
        }

        // If valid, return user data
        const userData = {
            id: user._id,
            adm_no: user.admissionNumber,
            email: user.email,
            fname: user.first_name,
            lname: user.last_name,
            user_cat: user.userCategory
        };
        res.status(200).json({ message: "Login successful", userData });
    } catch (err) {
        console.log("Login error", err);
        res.status(500).json({ message: "Server error", error: err });
    }
};
