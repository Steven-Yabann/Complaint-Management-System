import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styling/login.css' // Make sure this path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Add this
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';

function ForgotPassword() { // This name must match export and App.jsx import
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const response = await axios.post('http://localhost:4000/api/forgot-password', { email });
            setMessage(response.data.message);
            setEmail(''); // Clear the email input after sending
        } catch (err) {
            console.error('Forgot password error:', err);
            const errorMessage = err.response?.data?.message || 'Failed to send reset email. Please try again.';
            setError(errorMessage);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="auth-container login-view"> {/* Reusing login-view for layout */}
                <div className="image-panel">
                </div>
                <div className="form-panel">
                    {/* Consistent back-home-btn with Login.jsx */}
                    <Link to="/" className="back-home-btn">Home</Link>

                    <h2>Forgot Password</h2> {/* Using h2 as per your CSS for these pages */}
                    <p>Enter your email address and we'll send you a One-Time Password (OTP) to reset your password.</p>

                    {message && <div className="message success">{message}</div>}
                    {error && <div className="message error">{error}</div>}

                    <form className="forgot-password-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <span><FontAwesomeIcon icon={faEnvelope} /></span>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Your Email Address"
                                required
                            />
                        </div>
                        <button type="submit" className="primary-btn">Send Reset Link</button> {/* Text change to match button */}
                    </form>
                    <div className="forgot-password-footer">
                        <Link to="/login" className="back-to-login-link">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;