// Frontend/src/pages/AdminProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styling/adminProfile.css';

const AdminProfilePage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch admin profile data when component mounts
        const fetchAdminProfile = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:4000/api/admin/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username);
                    setNewUsername(data.username);
                    setEmail(data.email);
                } else {
                    const errorData = await response.json();
                    setMessage(errorData.message || 'Failed to fetch admin profile data.');
                }
            } catch (err) {
                setMessage('Network error: Could not load profile data.');
                console.error('Error fetching admin profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminProfile();
    }, [navigate]);

    const handleUsernameChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:4000/api/admin/profile/username', {
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
                setUsername(newUsername);
                localStorage.setItem('username', newUsername);
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
            const response = await fetch('http://localhost:4000/api/admin/request-password-reset-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'OTP sent to your admin email.');
                setMaskedEmail(data.email || email);
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

        // Enhanced password validation for admin
        if (newPassword.length < 8) {
            setMessage('Admin password must be at least 8 characters long.');
            setLoading(false);
            return;
        }

        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            setMessage('Admin password must contain at least one uppercase letter, one lowercase letter, and one number.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/admin/reset-password-with-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email,
                    otp,
                    newPassword,
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Admin password reset successfully! You will be logged out for security.');
                setOtpSent(false);
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');
                
                // Log out the admin for security after password change
                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    localStorage.removeItem('userRole');
                    navigate('/login');
                }, 3000);
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

    if (loading && username === '') {
        return <div className="admin-profile-container">Loading admin profile...</div>;
    }

    return (
        <div className="admin-profile-container">
            <div className="admin-profile-wrapper">
                <div className="profile-header">
                    <h2>Admin Profile Settings</h2>
                    <div className="admin-badge">Administrator</div>
                </div>

                {message && (
                    <div className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <div className="profile-sections">
                    <section className="profile-section username-section">
                        <h3>🔧 Change Username</h3>
                        <div className="current-info">
                            <p><strong>Current Username:</strong> {username}</p>
                            <p><strong>Email:</strong> {email}</p>
                            <p><strong>Role:</strong> System Administrator</p>
                        </div>
                        <form onSubmit={handleUsernameChange} className="profile-form">
                            <div className="form-group">
                                <label htmlFor="newUsername">New Username:</label>
                                <input
                                    type="text"
                                    id="newUsername"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    required
                                    minLength="3"
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Username'}
                            </button>
                        </form>
                    </section>

                    <hr className="section-divider" />

                    <section className="profile-section password-section">
                        <h3>🔐 Admin Password Reset (2FA Required)</h3>
                        <div className="security-notice">
                            <p><strong>⚠️ Enhanced Security Notice:</strong></p>
                            <ul>
                                <li>Admin passwords require enhanced complexity</li>
                                <li>Must be at least 8 characters long</li>
                                <li>Must contain uppercase, lowercase, and numbers</li>
                                <li>You will be logged out after password change</li>
                            </ul>
                        </div>

                        {!otpSent ? (
                            <form onSubmit={handleRequestOtp} className="profile-form">
                                <p>An OTP will be sent to your registered admin email: <strong>{email}</strong></p>
                                <button type="submit" className="submit-btn otp-btn" disabled={loading}>
                                    {loading ? 'Sending Secure OTP...' : 'Send Admin OTP to Email'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handlePasswordReset} className="profile-form">
                                <p className="info-text">
                                    📧 Enter the OTP sent to <strong>{maskedEmail}</strong> and your new admin password.
                                </p>
                                <div className="form-group">
                                    <label htmlFor="otp">Security OTP:</label>
                                    <input
                                        type="text"
                                        id="otp"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength="6"
                                        required
                                        placeholder="Enter 6-digit OTP"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="newPassword">New Admin Password:</label>
                                    <input
                                        type="password"
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength="8"
                                        placeholder="Min 8 chars, include A-Z, a-z, 0-9"
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
                                        placeholder="Confirm your new password"
                                    />
                                </div>
                                <button type="submit" className="submit-btn reset-btn" disabled={loading}>
                                    {loading ? 'Resetting Admin Password...' : 'Reset Admin Password'}
                                </button>
                                <button 
                                    type="button" 
                                    className="cancel-btn" 
                                    onClick={() => {
                                        setOtpSent(false);
                                        setOtp('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                        setMessage('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </form>
                        )}
                    </section>
                </div>

                <div className="back-to-dashboard-container">
                    <button 
                        onClick={() => navigate('/admin/dashboard')} 
                        className="btn btn-secondary"
                    >
                        ← Back to Admin Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminProfilePage;