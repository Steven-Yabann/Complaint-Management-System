import React, { useState } from "react";
import { Link } from "react-router-dom";
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
        const newErrors = { ...errors };

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
            valid = false;
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
            valid = false;
        }

        if (!formData.email) {
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const isValid = validateRegister();
        
        if (isValid) {
            console.log('Registration submitted:', formData);
            // Add your registration logic here
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
                        <span>✉️</span>
                        <input 
                            type="email" 
                            name="email"
                            placeholder="Email" 
                            value={formData.email}
                            onChange={handleChange}
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