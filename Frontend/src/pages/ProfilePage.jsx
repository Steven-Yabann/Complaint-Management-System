// frontend/src/pages/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styling/profilePage.css'; // Make sure to create this CSS file

const ProfilePage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [email, setEmail] = useState(''); // To display and use for OTP sending

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch user profile data when component mounts
        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:4000/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username);
                    setNewUsername(data.username); // Pre-fill with current username
                    setEmail(data.email); // Assume email is part of the user profile
                } else {
                    const errorData = await response.json();
                    setMessage(errorData.message || 'Failed to fetch profile data.');
                }
            } catch (err) {
                setMessage('Network error: Could not load profile data.');
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const handleUsernameChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:4000/api/users/profile/username', { // Backend endpoint for username update
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newUsername })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Username updated successfully!');
                setUsername(newUsername); // Update displayed username
                localStorage.setItem('username', newUsername); // Update local storage
            } else {
                setMessage(data.message || 'Failed to update username.');
            }
        } catch (err) {
            setMessage('Network error: Could not update username.');
            console.error('Error updating username:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            // Backend should send OTP to the email associated with the authenticated user
            const response = await fetch('http://localhost:4000/api/users/request-password-reset-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Authenticate the request to know whose email to send to
                },
                 body: JSON.stringify({ email }) // Sending email is good for backend verification
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'OTP sent to your email.');
                setOtpSent(true);
            } else {
                setMessage(data.message || 'Failed to send OTP.');
            }
        } catch (err) {
            setMessage('Network error: Could not request OTP.');
            console.error('Error requesting OTP:', err);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        const token = localStorage.getItem('token');

        if (newPassword !== confirmPassword) {
            setMessage('New password and confirm password do not match.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/users/reset-password-with-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Authenticate the request
                },
                body: JSON.stringify({
                    email, // The email to identify the user on the backend
                    otp,
                    newPassword,
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Password reset successfully! Please log in with your new password.');
                setOtpSent(false); // Reset form state
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                // Optionally, log the user out after successful password change for security

                localStorage.removeItem('token'); // Clear token
                localStorage.removeItem('username'); // Clear username
                navigate('/login'); // Redirect to login page
                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    navigate('/login');
                }, 2000);
            } else {
                setMessage(data.message || 'Failed to reset password. Invalid OTP or other error.');
            }
        } catch (err) {
            setMessage('Network error: Could not reset password.');
            console.error('Error resetting password:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && username === '') { // Show loading only for initial profile fetch
        return <div className="profile-page-container">Loading profile...</div>;
    }

    return (
        <div className="profile-page-container">
            <div className="profile-form-wrapper">
                <h2>User Profile</h2>
                {message && (
                    <div className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <section className="profile-section username-section">
                    <h3>Change Username</h3>
                    <p>Current Username: <strong>{username}</strong></p>
                    <form onSubmit={handleUsernameChange} className="profile-form">
                        <div className="form-group">
                            <label htmlFor="newUsername">New Username:</label>
                            <input
                                type="text"
                                id="newUsername"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Updating...' : 'Update Username'}
                        </button>
                    </form>
                </section>

                <hr className="section-divider" />

                <section className="profile-section password-section">
                    <h3>Reset Password (2FA)</h3>
                    {!otpSent ? (
                        <form onSubmit={handleRequestOtp} className="profile-form">
                            <p>An OTP will be sent to your registered email: <strong>{email}</strong></p>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Sending OTP...' : 'Send OTP to Email'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordReset} className="profile-form">
                            <p className="info-text">Enter the OTP sent to <strong>{email}</strong> and your new password.</p>
                            <div className="form-group">
                                <label htmlFor="otp">OTP:</label>
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength="6" // Assuming a 6-digit OTP
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="newPassword">New Password:</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password:</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    )}
                </section>

                <div className="back-to-dashboard-container">
                    <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Back to Dashboard</button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;

