// frontend/src/pages/LoginPage.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import '../styling/login.css';
import loginImg from '../assets/login.avif';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: '', // Only username now
        password: ''
    });
    const [errors, setErrors] = useState({
        username: '', // Only username now
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

        // Validate username for login
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
                        username: formData.username, // Send only username and password
                        password: formData.password
                    }),
                });

                const data = await response.json();

                if (response.ok) {
                    setLoginMessage(data.message || 'Login successful! Redirecting...');
                    localStorage.setItem('token', data.token);

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
                            type="text" // Changed to type="text"
                            name="username" // Changed name to "username"
                            placeholder="Username" // Changed placeholder to "Username"
                            value={formData.username} // Using formData.username
                            onChange={handleChange}
                            autoComplete="username"
                        />
                    </div>
                    {errors.username && <span className="error-message">{errors.username}</span>} {/* Display username error */}

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