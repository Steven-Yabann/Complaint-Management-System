import React, { useState } from "react";
import '../styling/login.css';
import loginImg from '../assets/login.avif';
import registerImg from '../assets/register.avif';

const Login = () => {
    const [showRegister, setShowRegister] = useState(false);
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

    const toggleForms = (e) => {
        e.preventDefault();
        setShowRegister(!showRegister);
        setErrors({ username: '', email: '', password: '', confirmPassword: '' });
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error when user starts typing
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
        const isValid = showRegister ? validateRegister() : validateLogin();
        
        if (isValid) {
            // Submit form data
            console.log('Form submitted:', formData);
            // Add your form submission logic here
        }
    };

    return (
        <div className={`auth-container ${showRegister ? 'register-view' : 'login-view'}`}>
            {/* Image Panel */}
            <div className="image-panel">
                <img 
                    src={showRegister ? registerImg : loginImg} 
                    alt={showRegister ? "Register" : "Login"} 
                />
            </div>

            {/* Form Panel */}
            <div className="form-panel">
                {!showRegister ? (
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
                            <button onClick={toggleForms} className="switch-btn">
                                Create Account
                            </button>
                        </div>
                    </form>
                ) : (
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
                            <button onClick={toggleForms} className="switch-btn">
                                Sign In
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;