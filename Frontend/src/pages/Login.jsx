import React, { useState } from "react";
import { Link } from "react-router-dom";
import '../styling/login.css';
import loginImg from '../assets/login.avif';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });
    const [errors, setErrors] = useState({
        username: '',
        password: ''
    });

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
        const newErrors = { ...errors };

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
            valid = false;
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
            valid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const isValid = validateLogin();
        
        if (isValid) {
            console.log('Login submitted:', formData);
            // Add your login logic here
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
                    <div className="input-group">
                        <span>👤</span>
                        <input 
                            type="text" 
                            name="username"
                            placeholder="Username" 
                            value={formData.username}
                            onChange={handleChange}
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