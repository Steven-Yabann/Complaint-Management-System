import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../styling/login.css';
import registerImg from '../assets/register.avif'; 

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        // --- IMPORTANT CHANGE: New fields based on User schema ---
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({
        username:'',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [registrationMessage, setRegistrationMessage] = useState('');
    const navigate = useNavigate();

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

    const validateRegister = () => {
        let valid = true;
        const newErrors = { // Initialize all error messages to empty strings
            username: '', email: '', password: '', confirmPassword: ''
        };

        if (!formData.username) {
            newErrors.username = 'Username is required';
            valid = false;
        }

        // Validate Email
        if (!formData.email) {
            newErrors.email = 'Email is required';
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email';
            valid = false;
        }

        // Validate Password
        if (!formData.password) {
            newErrors.password = 'Password is required';
            valid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            valid = false;
        }

        // Validate Confirm Password
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setRegistrationMessage('');
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
                    setRegistrationMessage('Registration successful! Redirecting to login...');
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                } else {
                    setRegistrationMessage(data.message || 'Registration failed. Please try again.');
                    console.error('Registration failed:', data);
                }
            } catch (error) {
                setRegistrationMessage('An error occurred during registration. Please check your network and try again.');
                console.error('Network or unexpected error during registration:', error);
            }
        }
    };

    return (
        <div className="auth-container register-view">
            <div className="image-panel">
                <img src={registerImg} alt="Register" />
            </div>

            <div className="form-panel">
                <Link to="/" className="back-home-btn">Home</Link>
                <form className="register-form" onSubmit={handleSubmit}>
                    <h1>Create Account</h1>
                    {registrationMessage && (
                        <div className={`message ${registrationMessage.includes('successful') ? 'success' : 'error'}`}>
                            {registrationMessage}
                        </div>
                    )}
                    {/* --- IMPORTANT CHANGE: Add First Name Input --- */}
                    <div className="input-group">
                        <span>👤</span>
                        <input
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.firstName}
                            onChange={handleChange}
                            autoComplete="username"
                        />
                    </div>
                    {errors.username && <span className="error-message">{errors.username}</span>}


                   
                    <div className="input-group">
                        <span>✉️</span>
                        <input
                            type="email" // Use type="email" for better browser validation
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
            </div>
        </div>
    );
};

export default RegisterPage;