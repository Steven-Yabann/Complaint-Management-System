// frontend/src/pages/UserDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styling/userDash.css';

const QuickActions = () => (
    <div className="dashboard-widget quick-actions">
        <h2>Quick Actions</h2>
        <Link to="/ComplaintPage" className="primary-btn">File New Complaint</Link>
        <Link to="/viewComplaints" className="secondary-btn">View All Complaints</Link>
    </div>
);

const ComplaintSummary = ({ complaints }) => {
    const total = complaints.length;
    const open = complaints.filter(c => c.status === 'Open').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

    return (
        <div className="dashboard-widget complaint-summary">
            <h2>Complaint Summary</h2>
            <div className="summary-grid">
                <div className="summary-item total">Total: <span>{total}</span></div>
                <div className="summary-item pending">Open: <span>{open}</span></div>
                <div className="summary-item in-progress">In Progress: <span>{inProgress}</span></div>
                <div className="summary-item resolved">Resolved/Closed: <span>{resolved}</span></div>
            </div>
        </div>
    );
};

const RecentComplaintsDisplay = ({ complaints }) => (
    <div className="dashboard-widget recent-complaints">
        <h2>Recent Complaints</h2>
        {complaints.length === 0 ? (
            <p>No recent complaints to display.</p>
        ) : (
            <ul>
                {complaints.slice(0, 5).map(complaint => (
                    <li key={complaint._id}>
                        <strong>{complaint.title}</strong> - Status: {complaint.status} ({new Date(complaint.createdAt).toLocaleDateString()})
                    </li>
                ))}
            </ul>
        )}
        {complaints.length > 5 && (
            <Link to="/viewComplaints" className="view-more-link">View All Complaints</Link>
        )}
    </div>
);

const UserDashboard = () => {
    const navigate = useNavigate();
    const [userComplaints, setUserComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState('User');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('userData');
        if (!token) {
            navigate('/login');
            return;
        }

        console.log('User:', user);

        const fetchUserProfile = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/users/profile', { // Assuming this endpoint exists on your backend
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username);
                    localStorage.setItem('username', data.username); // Update localStorage with actual username
                } else {
                    console.error('Failed to fetch user profile:', await response.json());
                    setUsername(localStorage.getItem('username') || 'User'); // Fallback
                }
            } catch (err) {
                console.error('Network error fetching user profile:', err);
                setUsername(localStorage.getItem('username') || 'User'); // Fallback
            }
        };

        const fetchUserComplaints = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/complaints/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUserComplaints(data.data);
                } else {
                    const errorData = await response.json();
                    setError(errorData.message || 'Failed to fetch complaints.');
                    console.error('Failed to fetch user complaints:', errorData);
                }
            } catch (err) {
                setError('Network error: Could not connect to the server.');
                console.error('Network error fetching user complaints:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
        fetchUserComplaints();
    }, [navigate]);

    if (loading) {
        return <div className="user-dashboard-container">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="user-dashboard-container">Error: {error}</div>;
    }

    return (
        <div className="user-dashboard-container">
            <nav className="dashboard-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-profile">
                        <svg className="profile-icon" viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                    </div>
                </div>
                <ul className="sidebar-links">
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    <li><Link to="/ComplaintPage">File Complaint</Link></li>
                    <li><Link to="/viewComplaints">View Complaints</Link></li>
                    <li><Link to="/profile">Profile</Link></li> {/* Link to the new Profile page */}
                    <li><Link to="/notifications">Notifications</Link></li>
                    {/* REMOVED: <li><Link to="/settings">Settings</Link></li> */}
                    <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                </ul>
            </nav>

            <main className="dashboard-main-content">
                <header className="main-content-header">
                    <h1>Welcome, {username}</h1>
                </header>

                <section className="dashboard-widgets-grid">
                    <QuickActions />
                    <ComplaintSummary complaints={userComplaints} />
                    <RecentComplaintsDisplay complaints={userComplaints} />
                </section>
            </main>
        </div>
    );
};

export default UserDashboard;