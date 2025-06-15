// frontend/src/pages/LoginPage.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../styling/login.css';
import loginImg from '../assets/login.avif';
import { jwtDecode } from 'jwt-decode'; // <-- NEW: Import jwtDecode

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [errors, setErrors] = useState({
        username: '',
        password: ''
    });
    const [loginMessage, setLoginMessage] = useState('');
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

    const validateLogin = () => {
        let valid = true;
        const newErrors = {
            username: '',
            password: ''
        };

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
            valid = false;
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginMessage('');
        const isValid = validateLogin();

        if (isValid) {
            try {
                const response = await fetch('http://localhost:4000/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password
                    }),
                });

                const data = await response.json();
                console.log('Login API Raw Response Data:', data); // Keep this for now for debugging

                if (response.ok) {
                    setLoginMessage(data.message || 'Login successful! Redirecting...');
                    localStorage.setItem('token', data.token);

                    // --- NEW LOGIC: Decode token to get username ---
                    try {
                        const decodedToken = jwtDecode(data.token);
                        console.log('Decoded Token:', decodedToken); // Log decoded token to verify structure
                        if (decodedToken && decodedToken.user && decodedToken.user.username) {
                            localStorage.setItem('username', decodedToken.user.username);
                        } else {
                            // Fallback if username isn't in the expected place in the token
                            console.warn("Username not found in decoded token payload. Using 'User' as default.");
                            localStorage.setItem('username', 'User');
                        }
                    } catch (decodeError) {
                        console.error('Error decoding JWT token:', decodeError);
                        localStorage.setItem('username', 'User'); // Set a fallback username
                    }
                    // --- END NEW LOGIC ---

                    setTimeout(() => {
                        navigate('/dashboard');
                    }, 1500);

                } else {
                    setLoginMessage(data.message || 'Login failed. Please check your credentials.');
                    console.error('Login failed:', data);
                }
            } catch (error) {
                setLoginMessage('An error occurred during login. Please try again later.');
                console.error('Error during login:', error);
            }
        }
    };

    return (
        <div className="auth-container login-view">
            <div className="image-panel">
                <img src={loginImg} alt="Login" />
            </div>

            <div className="form-panel">
                <Link to="/" className="back-home-btn">Home</Link>
                <form className="login-form" onSubmit={handleSubmit}>
                    <h1>Welcome Back</h1>
                    {loginMessage && <div className={`message ${loginMessage.includes('successful') ? 'success' : 'error'}`}>{loginMessage}</div>}
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
                        <span>🔒</span>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                        />
                    </div>
                    {errors.password && <span className="error-message">{errors.password}</span>}

                    <button type="submit" className="primary-btn">Sign In</button>
                    <div className="form-footer">
                        <p>New here?</p>
                        <Link to="/register" className="switch-btn">
                            Create Account
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;