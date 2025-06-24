// frontend/src/pages/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserNavbar from '../components/userNavbar'; // Import the new Navbar component
import '../styling/userDash.css';

// Reusable components (QuickActions, ComplaintSummary, RecentComplaintsDisplay) remain the same
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
    const [username, setUsername] = useState('User'); // Default to 'User'

    // handleLogout function is now passed to the UserNavbar component
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username'); // Get username from localStorage
        if (storedUsername) {
            setUsername(storedUsername); // Set username from localStorage immediately
        }

        if (!token) {
            navigate('/login');
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.username); // Update with fetched username
                    localStorage.setItem('username', data.username); // Store in localStorage
                } else {
                    console.error('Failed to fetch user profile:', await response.json());
                    // Fallback to 'User' or what was in localStorage
                    setUsername(storedUsername || 'User');
                }
            } catch (err) {
                console.error('Network error fetching user profile:', err);
                setUsername(storedUsername || 'User'); // Fallback
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
    }, [navigate]); // Added navigate to dependency array

    if (loading) {
        return <div className="user-dashboard-container">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="user-dashboard-container">Error: {error}</div>;
    }

    return (
        <div className="user-dashboard-container">
            {/* Render the UserNavbar component */}
            <UserNavbar username={username} onLogout={handleLogout} />

            <main className="dashboard-main-content">
                <header className="main-content-header">
                    <h1>Welcome, {username}!</h1> {/* Display fetched username */}
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