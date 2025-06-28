// Frontend/src/pages/RegisterPage.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../styling/login.css'; // Reusing general login/auth styling
import registerImg from '../assets/stmb.jpg'; 

const RegisterPage = () => {
    const navigate = useNavigate();

    // State for registration form data
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    // State for registration form errors
    const [errors, setErrors] = useState({
        username: '', 
        email: '', 
        password: '', 
        confirmPassword: ''
    });
    // State for messages displayed after registration or verification attempts
    const [message, setMessage] = useState(''); 
    // State to control which form is displayed: false for registration, true for verification
    const [showVerification, setShowVerification] = useState(false);
    // State for OTP input (used in the verification phase)
    const [otp, setOtp] = useState('');
    // State for resend OTP cooldown
    const [resendCooldown, setResendCooldown] = useState(0);

    // Handler for changes in registration form inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setErrors({
            ...errors,
            [name]: ''
        });
    };

    // Client-side validation for the registration form
    const validateRegister = () => {
        let valid = true;
        const newErrors = { 
            username: '', email: '', password: '', confirmPassword: ''
        };

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
            valid = false;
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
            valid = false;
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
            valid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            valid = false;
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
            valid = false;
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    // Handles the submission of the registration form
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        const isValid = validateRegister();

        if (isValid) {
            try {
                const response = await fetch('http://localhost:4000/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.username,
                        email: formData.email,
                        password: formData.password
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    setMessage(data.message || 'Registration successful! Please check your email for a verification code.');
                    setShowVerification(true); // Switch to the verification form
                    // Start cooldown for resend OTP (e.g., 60 seconds)
                    setResendCooldown(60); 
                } else {
                    setMessage(data.message || 'Registration failed. Please try again.');
                    console.error('Registration failed:', data);
                }
            } catch (error) {
                setMessage('An error occurred during registration. Please check your network and try again.');
                console.error('Network or unexpected error during registration:', error);
            }
        }
    };

    // Handles the submission of the OTP verification form
    const handleVerifyOtpSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!otp.trim()) {
            setMessage('Please enter the OTP.');
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp }) // Use email from formData
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Email verified successfully! Redirecting to login...');
                // Optionally clear OTP input on success
                setOtp(''); 
                setTimeout(() => {
                    navigate('/login'); // Redirect to login after successful verification
                }, 2000);
            } else {
                setMessage(data.message || 'Email verification failed. Please try again.');
                console.error('Email verification failed:', data);
            }
        } catch (error) {
            setMessage('Network error during verification. Please try again later.');
            console.error('Network error during email verification:', error);
        }
    };

    // Handles resending the OTP
    const handleResendOtp = async () => {
        setMessage('');

        // Set cooldown to prevent immediate multiple requests
        setResendCooldown(60); // 60 seconds cooldown

        try {
            const response = await fetch('http://localhost:4000/api/resend-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }) // Use email from formData
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'New OTP sent to your email.');
            } else {
                setMessage(data.message || 'Failed to resend OTP.');
                console.error('Resend OTP failed:', data);
            }
        } catch (error) {
            setMessage('Network error when resending OTP.');
            console.error('Network error resending OTP:', error);
        }
    };

    // Effect for resend cooldown timer
    React.useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setInterval(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [resendCooldown]);

    return (
        <div className="login-page-wrapper">
            <div className="auth-container register-view">
                <div className="image-panel">
                    <img src={registerImg} alt="Register" />
                </div>

                <div className="form-panel">
                    <Link to="/" className="back-home-btn">Home</Link>
                    {/* Conditionally render either the registration form or the verification form */}
                    {!showVerification ? (
                        <form className="register-form" onSubmit={handleRegisterSubmit}>
                            <h1>Create Account</h1>
                            {message && (
                                <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
                                    {message}
                                </div>
                            )}
                            
                            <div className="input-group">
                                <span>👤</span>
                                <input
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    autoComplete="username"
                                />
                            </div>
                            {errors.username && <span className="error-message">{errors.username}</span>}
                            
                            <div className="input-group">
                                <span>✉️</span>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && <span className="error-message">{errors.email}</span>}

                            <div className="input-group">
                                <span>🔒</span>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}

                            <div className="input-group">
                                <span>🔒</span>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Confirm Password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                />
                            </div>
                            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}

                            <button type="submit" className="primary-btn">Register</button>
                            <div className="form-footer">
                                <p>Already have an account?</p>
                                <Link to="/login" className="switch-btn">
                                    Sign In
                                </Link>
                            </div>
                        </form>
                    ) : (
                        // Email Verification Form
                        <form className="auth-form" onSubmit={handleVerifyOtpSubmit}>
                            <h1>Verify Your Email</h1>
                            <p className="form-subtitle">A 6-digit code has been sent to <br /> <strong>{formData.email}</strong>.</p>
                            {message && (
                                <div className={`message ${message.includes('successful') || message.includes('sent') ? 'success' : 'error'}`}>
                                    {message}
                                </div>
                            )}
                            <div className="input-group">
                                <span>🔑</span>
                                <input
                                    type="text"
                                    name="otp"
                                    placeholder="Verification Code (OTP)"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength="6"
                                    required
                                />
                            </div>
                            <button type="submit" className="primary-btn">Verify Email</button>
                            <div className="form-footer">
                                <p>Didn't receive the code?</p>
                                <button
                                    type="button"
                                    className="switch-btn"
                                    onClick={handleResendOtp}
                                    disabled={resendCooldown > 0}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
