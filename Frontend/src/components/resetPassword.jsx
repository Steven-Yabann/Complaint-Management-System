import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styling/login.css'; // Make sure this path is correct
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Add this
import { faLock } from '@fortawesome/free-solid-svg-icons';


function ResetPassword() { // This name must match export and App.jsx import
    const { token } = useParams(); // Get the token from URL parameter
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        try {
            const response = await axios.post(`http://localhost:4000/api/reset-password/${token}`, { password });

            setMessage(response.data.message + " Redirecting to login...");
            setPassword('');
            setConfirmPassword('');

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            console.error('Reset password error:', err);
            const errorMessage = err.response?.data?.message || 'Failed to reset password. Please try again.';
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

                    <h2>Reset Password</h2> {/* Using h2 as per your CSS for these pages */}
                    <p>Enter your new password below.</p>

                    {message && <div className="message success">{message}</div>}
                    {error && <div className="message error">{error}</div>}

                    <form className="reset-password-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <span><FontAwesomeIcon icon={faLock} /></span>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="New Password"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <span><FontAwesomeIcon icon={faLock} /></span>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm New Password"
                                required
                            />
                        </div>
                        <button type="submit" className="primary-btn">Set New Password</button>
                    </form>
                    <div className="reset-password-footer">
                        <Link to="/login" className="back-to-login-link">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;