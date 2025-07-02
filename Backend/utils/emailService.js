// backend/utils/emailService.js

const nodemailer = require('nodemailer');
require("dotenv").config({path: "./config.env"})

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS, 
    }
});

const sendEmail = async (to, subject, text, html) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER, // Sender address
            to,       // List of receivers
            subject,  // Subject line
            text,     // Plain text body
            html      // HTML body
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully!');
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Could not send email.');
    }
};

module.exports = sendEmail;