// frontend/src/pages/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Assuming you use jwt-decode

import UserNavbar from '../components/userNavbar'; // Import the UserNavbar component
import '../styling/profilePage.css'; // Your page-specific CSS
import '../styling/userDash.css';    // For the main layout container and main content area
import '../styling/navbar.css';      // For the UserNavbar's styling

const ProfilePage = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('User'); // Initialize with 'User' for the navbar
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false); // Used for form submissions
    const [initialLoading, setInitialLoading] = useState(true); // For initial profile fetch
    const [otpSent, setOtpSent] = useState(false);
    const [email, setEmail] = useState(''); // To display and use for OTP sending

    // Function to handle logout, passed to UserNavbar
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username'); // Get username from localStorage

        if (storedUsername) {
            setUsername(storedUsername); // Set username for navbar immediately
        }

        if (!token) {
            navigate('/login');
            return;
        }

        // Token validation logic (important for protected routes)
        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            if (decodedToken.exp < currentTime) {
                console.warn("Token expired. Please log in again.");
                localStorage.removeItem('token');
                localStorage.removeItem('username'); // Clear username on token expiry
                navigate('/login');
                return;
            }
        } catch (e) {
            console.error("Error decoding token or token is invalid:", e);
            localStorage.removeItem('token'); // Clear invalid token
            localStorage.removeItem('username'); // Clear username for invalid token
            navigate('/login');
            return;
        }

        // Fetch user profile data when component mounts
        const fetchUserProfile = async () => {
            setLoading(true); // Indicate loading for the fetch operation
            setInitialLoading(true); // Set initial loading for the whole page
            try {
                const response = await fetch('http://localhost:4000/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username); // Update displayed username for the page
                    setNewUsername(data.username); // Pre-fill new username field
                    setEmail(data.email); // Assume email is part of the user profile
                    localStorage.setItem('username', data.username); // Ensure local storage is updated with actual username
                } else {
                    const errorData = await response.json();
                    setMessage(errorData.message || 'Failed to fetch profile data.');
                    console.error('Error fetching profile:', errorData);
                }
            } catch (err) {
                setMessage('Network error: Could not load profile data.');
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false); // End loading for fetch operation
                setInitialLoading(false); // End initial page loading
            }
        };

        fetchUserProfile();
    }, [navigate]);

    const handleUsernameChange = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true); // Indicate loading for form submission
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
                setUsername(newUsername); // Update displayed username on success
                localStorage.setItem('username', newUsername); // Update local storage
            } else {
                setMessage(data.message || 'Failed to update username.');
            }
        } catch (err) {
            setMessage('Network error: Could not update username.');
            console.error('Error updating username:', err);
        } finally {
            setLoading(false); // End loading for form submission
        }
    };

    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true); // Indicate loading for OTP request
        const token = localStorage.getItem('token');

        try {
            const response = await fetch('http://localhost:4000/api/users/request-password-reset-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
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
            setLoading(false); // End loading for OTP request
        }
    };

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true); // Indicate loading for password reset
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
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    email, // The email to identify the user on the backend
                    otp,
                    newPassword,
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage(data.message || 'Password reset successfully! Redirecting to login.');
                setOtpSent(false); // Reset form state
                setOtp('');
                setNewPassword('');
                setConfirmPassword('');

                // Log the user out and redirect after successful password change for security
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
            setLoading(false); // End loading for password reset
        }
    };

    // Show loading state for initial profile fetch, wrapped in the layout
    if (initialLoading) {
        return (
            <div className="user-dashboard-container">
                <UserNavbar username={username} onLogout={handleLogout} />
                <main className="dashboard-main-content">
                    <div className="loading-state">Loading profile...</div>
                </main>
            </div>
        );
    }

    return (
        // The main layout container that arranges sidebar and main content
        <div className="user-dashboard-container">
            {/* Render the UserNavbar component, passing username and logout handler */}
            <UserNavbar username={username} onLogout={handleLogout} />

            {/* The main content area where your profile forms reside */}
            <main className="dashboard-main-content">
                <header className="main-content-header">
                    <h1>User Profile</h1>
                </header>

                <div className="profile-form-wrapper dashboard-widget"> {/* Using dashboard-widget for consistent styling */}
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
                                    disabled={loading} // Disable input during submission
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
                                        disabled={loading}
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
                                        disabled={loading}
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
                                        disabled={loading}
                                    />
                                </div>
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </form>
                        )}
                    </section>

                    {/* Removed the local "Back to Dashboard" button as the navbar provides this */}
                    {/* <div className="back-to-dashboard-container">
                        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">Back to Dashboard</button>
                    </div> */}
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;