const User = require('../models/user_model.js');
const bcrypt = require('bcrypt');


exports.loginUser = async (req, res) => {
    console.log("Received login data: ", req.body);
    const {admissionNo, password} = req.body;

    try{
        // Find user with ADM no
        const user = await User.findOne({ admissionNumber: admissionNo });
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
            id : user._id,
            adm_no : user.admissionNumber,
            email : user.email,
            fname : user.first_name,
            lname : user.last_name,
            user_cat : user.userCategory
        }
    } catch (err) {
        console.log("Login error", err);
        res.status(500).json( {message: "Server error ", error : err});
    }
}