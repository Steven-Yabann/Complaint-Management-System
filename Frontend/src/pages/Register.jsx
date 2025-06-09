import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import '../styling/login.css';
import registerImg from '../assets/register.avif';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    // State to hold messages for the user (success/error from backend)
    const [registrationMessage, setRegistrationMessage] = useState('');
    const navigate = useNavigate(); // Initialize useNavigate hook for redirection

    // Handles changes in form input fields
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear previous error message for the field when user starts typing
        setErrors({
            ...errors,
            [name]: ''
        });
    };

    // Performs client-side validation of the registration form data
    const validateRegister = () => {
        let valid = true;
        const newErrors = { // Create a mutable copy of errors
            username: '', email: '', password: '', confirmPassword: ''
        };

        // Validate Username
        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
            valid = false;
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
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

        setErrors(newErrors); // Update errors state
        return valid; // Return overall validation status
    };

    // Handles form submission
    const handleSubmit = async (e) => { // Made async because we'll be using await for the fetch call
        e.preventDefault(); // Prevent default form submission behavior (page reload)
        setRegistrationMessage(''); // Clear any previous registration messages

        const isValid = validateRegister(); // Run client-side validation

        if (isValid) {
            try {
                // --- Start: Backend API Call ---
                const response = await fetch('http://localhost:4000/api/register', { // IMPORTANT: Use your backend URL and endpoint
                    method: 'POST', // HTTP method for registration
                    headers: {
                        'Content-Type': 'application/json', // Tell the server we're sending JSON
                    },
                    // Send only the necessary data to the backend (username, email, password)
                    body: JSON.stringify({
                        username: formData.username,
                        email: formData.email,
                        password: formData.password
                    }),
                });

                const data = await response.json(); // Parse the JSON response from the backend

                if (response.ok) { // Check if the HTTP status code is 2xx (success)
                    setRegistrationMessage(data.message || 'Registration successful! Redirecting to login...');
                    // Redirect to login page after a short delay for user to read message
                    setTimeout(() => {
                        navigate('/login');
                    }, 2000);
                } else {
                    // Handle errors from the backend (e.g., email/username already exists, invalid data)
                    // The backend should send an error message in its JSON response
                    setRegistrationMessage(data.message || 'Registration failed. Please try again.');
                    console.error('Registration failed on server:', data);
                }
                // --- End: Backend API Call ---

            } catch (error) {
                // Catch network errors or other unexpected issues during the fetch request
                setRegistrationMessage('An error occurred during registration. Please check your network connection and try again.');
                console.error('Error during fetch request:', error);
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
                    {/* Display registration success/error messages */}
                    {registrationMessage && (
                        <div className={`message ${registrationMessage.includes('successful') ? 'success' : 'error'}`}>
                            {registrationMessage}
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
                            autoComplete="username" // Helps browser autofill
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
                            autoComplete="email" // Helps browser autofill
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
                            autoComplete="new-password" // Helps browser autofill
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
                            autoComplete="new-password" // Helps browser autofill
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