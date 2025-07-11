const User = require('../models/User.js');
const bcrypt = require('bcryptjs'); // used for hashing passwords
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService'); 

// Helper function to sign a JWT token
const generateToken = (id, role, username) => {
    console.log(`DEBUG: process.env.JWT_EXPIRE = "${process.env.JWT_EXPIRE}"`);
    const expiresInValue = process.env.JWT_EXPIRE || '1h';

    return jwt.sign(
        { id, role, username },
        process.env.JWT_SECRET,
        { expiresIn: expiresInValue } 
    );
};

// @desc    Register User
// @route   POST /api/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please enter all required fields: username, email, and password.' });
    }
    try {
        // Check for existing user by username or email
        let existingUser = await User.findOne({
            $or: [
                { username: username },
                { email: email.toLowerCase() }
            ]
        });

        if (existingUser) {
            let field = '';
            if (existingUser.username === username) field = 'Username';
            else if (existingUser.email === email.toLowerCase()) field = 'Email';
            return res.status(409).json({ message: `${field} is already registered.` });
        }

        // Create a new User instance (password will be hashed by pre-save hook)
        const newUser = new User({
            username,
            email: email.toLowerCase(), 
            password,
            role: role || 'user', 
            isVerified: false 
        });
        // Generate OTP and set expiry for email verification using the method from User model
        const otp = newUser.generateEmailOTP();

        await newUser.save(); // Save the new user with OTP and expiry

        // Send OTP email
        const mailOptions = {
            to: newUser.email,
            subject: 'Verify Your Email for Complaint System',
            html: `
                <p>Hello ${newUser.username},</p>
                <p>Thank you for registering with our Complaint Management System.</p>
                <p>Your One-Time Password (OTP) for email verification is:</p>
                <h3 style="color: #4CAF50;">${otp}</h3>
                <p>This OTP is valid for 10 minutes. Please enter this code on the verification page to activate your account.</p>
                <p>If you did not register for this service, please ignore this email.</p>
                <p>Best regards,</p>
                <p>Your Complaint System Team</p>
            `
        };

        try {
            await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
            console.log(`Verification OTP email sent to ${newUser.email}`);
        } catch (emailError) {
            console.error('Error sending OTP email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email for a verification code to activate your account.'
        });

    } catch (err) {
        console.error("Registration error:", err);
        if (err.name === 'ValidationError') {
            const errors = Object.values(err.errors).map(el => el.message);
            return res.status(400).json({ message: `Validation Error: ${errors.join(', ')}` });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// @desc    Verify User Email with OTP
// @route   POST /api/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Check if OTP matches and is not expired
        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Mark user as verified, clear OTP fields
        user.isVerified = true;
        user.otp = undefined;      
        user.otpExpires = undefined; 

        await user.save(); // Save the updated user

        res.status(200).json({ success: true, message: 'Email verified successfully! You can now log in.' });

    } catch (error) {
        console.error("Email verification error:", error);
        res.status(500).json({ message: 'Server error during email verification.' });
    }
};

// @desc    Resend Email Verification OTP
// @route   POST /api/resend-otp
// @access  Public (or semi-private, could allow only if user exists and is not verified)
exports.resendOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required.' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified.' });
        }

        // Generate a new OTP and set new expiry
        const otp = user.generateEmailOTP();
        await user.save(); // Save user with new OTP and expiry

        // Send new OTP email
        const mailOptions = {
            to: user.email,
            subject: 'New Email Verification Code for Complaint System',
            html: `
                <p>Hello ${user.username},</p>
                <p>Here is your new One-Time Password (OTP) for email verification:</p>
                <h3 style="color: #4CAF50;">${otp}</h3>
                <p>This OTP is valid for 10 minutes. Please enter this code on the verification page to activate your account.</p>
                <p>If you did not request this, please ignore this email.</p>
                <p>Best regards,</p>
                <p>Your Complaint System Team</p>
            `
        };

        try {
            await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
            console.log(`Resend OTP email sent to ${user.email}`);
        } catch (emailError) {
            console.error('Error sending resend OTP email:', emailError);
            // Log email error, but still return success for the resend request from API perspective
        }

        res.status(200).json({ success: true, message: 'New OTP sent to your email.' });

    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ message: 'Server error while resending OTP.' });
    }
};


// @desc    Login User
// @route   POST /api/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Please provide both username/email and password." });
    }

    try {
        const user = await User.findOne({
            //logical or to check both username and email
            $or: [
                { username: username },
                { email: username.toLowerCase() }
            ]
        }).select('+password');

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials." });
        }
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const token = generateToken(user._id, user.role, user.username);

        res.status(200).json({
            success: true,
            message: "Login successful!",
            token,
            username: user.username,
            role: user.role
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error during login. Please try again later." });
    }
};

// --- NEW FUNCTIONS FOR FORGOT AND RESET PASSWORD ---

// @desc    Request password reset (sends OTP)
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Please provide your email address.' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset OTP has been sent.' });
        }

        
        const otp = user.generateEmailOTP();
        
        await user.save({ validateBeforeSave: false }); // Save the user with the new OTP and expiry

        // Construct the reset URL using the OTP
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${otp}`;

        const mailOptions = {
            to: user.email,
            subject: 'Password Reset Request for Complaint System',
            html: `
                <p>Hello ${user.username},</p>
                <p>You are receiving this because you (or someone else) has requested the reset of the password for your account.</p>
                <p>Your One-Time Password (OTP) for password reset is: <strong>${otp}</strong></p>
                <p>You can also use this link directly to reset your password (the OTP is part of the link):</p>
                <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
                <p>This OTP is valid for 10 minutes.</p>
                <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
                <p>Best regards,</p>
                <p>Your Complaint System Team</p>
            `
        };

        try {
            await sendEmail(mailOptions.to, mailOptions.subject, '', mailOptions.html);
            console.log(`Password reset OTP email sent to ${user.email}`);
            res.status(200).json({ success: true, message: 'Password reset OTP sent to your email.' });
        } catch (emailError) {
            console.error('Error sending reset password email:', emailError);
            user.otp = undefined;
            user.otpExpires = undefined;
            await user.save({ validateBeforeSave: false });
            res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
        }

    } catch (error) {
        console.error('Forgot password process error:', error);
        res.status(500).json({ message: 'Server error during forgot password process.' });
    }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password/:otp
// @access  Public
exports.resetPassword = async (req, res) => {
    const { otp } = req.params; // Get OTP from URL parameter
    const { password } = req.body; // New password from request body

    if (!password) {
        return res.status(400).json({ message: 'Please provide a new password.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        const user = await User.findOne({
            otp: otp, // Find user by the exact OTP
            otpExpires: { $gt: Date.now() } // Check if OTP is still valid/not expired
        }).select('+password');// Select password to allow hashing

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired password reset OTP.' });
        }

        
        user.password = password; 
        user.otp = undefined;
        user.otpExpires = undefined;
        user.isVerified = true; 

        await user.save(); 

        res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });

    } catch (error) {
        console.error('Reset password process error:', error);
        // Handle validation errors from User model (e.g., if password minlength fails)
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            return res.status(400).json({ message: `Password Validation Error: ${errors.join(', ')}` });
        }
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};