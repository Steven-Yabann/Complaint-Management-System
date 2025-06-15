// frontend/src/pages/UserDashboard.jsx

import React, { useState, useEffect } from 'react'; // Make sure useEffect is imported
import { Link, useNavigate } from 'react-router-dom';
import '../styling/userDash.css';

// We will make these components accept props to be dynamic
const QuickActions = () => (
    <div className="dashboard-widget quick-actions">
        <h2>Quick Actions</h2>
        <Link to="/ComplaintPage" className="primary-btn">File New Complaint</Link>
        <Link to="/viewComplaints" className="secondary-btn">View All Complaints</Link> 
    </div>
);

// This component will now receive complaint data as a prop
const ComplaintSummary = ({ complaints }) => {
    // Calculate summary based on the actual complaints data
    const total = complaints.length;
    const open = complaints.filter(c => c.status === 'Open').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length; // Assuming 'Closed' also means resolved

    return (
        <div className="dashboard-widget complaint-summary">
            <h2>Complaint Summary</h2>
            <div className="summary-grid">
                <div className="summary-item total">Total: <span>{total}</span></div>
                <div className="summary-item pending">Open: <span>{open}</span></div> {/* Changed from Pending to Open to match schema */}
                <div className="summary-item in-progress">In Progress: <span>{inProgress}</span></div>
                <div className="summary-item resolved">Resolved/Closed: <span>{resolved}</span></div>
            </div>
        </div>
    );
};

// You might want to update this to show recent actual complaints or notifications based on complaints
const RecentComplaintsDisplay = ({ complaints }) => (
    <div className="dashboard-widget recent-complaints">
        <h2>Recent Complaints</h2>
        {complaints.length === 0 ? (
            <p>No recent complaints to display.</p>
        ) : (
            <ul>
                {complaints.slice(0, 5).map(complaint => ( // Show up to 5 most recent complaints
                    <li key={complaint._id}>
                        <strong>{complaint.title}</strong> - Status: {complaint.status} ({new Date(complaint.createdAt).toLocaleDateString()})
                        {/* Optional: Add a link to view full complaint details */}
                    </li>
                ))}
            </ul>
        )}
        {complaints.length > 5 && (
            <Link to="/complaint-status" className="view-more-link">View All Complaints</Link>
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

    // Authentication check should probably be higher up or use context/router protection
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');
        if (!token) {
            navigate('/login');
            return;
        }

        if(storedUsername){
            setUsername(storedUsername);
        }

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

        fetchUserComplaints();
    }, [navigate]); // Re-run if navigate changes (though unlikely, it's good practice for hooks)


    if (loading) {
        return <div className="user-dashboard-container">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="user-dashboard-container">Error: {error}</div>;
    }

    return (
        <div className="user-dashboard-container">
            {/* Sidebar */}
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
                    <li><Link to="/profile">Profile</Link></li>
                    <li><Link to="/notifications">Notifications</Link></li>
                    <li><Link to="/settings">Settings</Link></li>
                    <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                </ul>
            </nav>

            {/* Main Content */}
            <main className="dashboard-main-content">
                <header className="main-content-header">
                    <h1>Welcome, {username}</h1> 
                </header>

                <section className="dashboard-widgets-grid">
                    <QuickActions />
                    <ComplaintSummary complaints={userComplaints} /> {/* Pass complaints as prop */}
                    <RecentComplaintsDisplay complaints={userComplaints} /> {/* Pass complaints as prop */}
                </section>
            </main>
        </div>
    );
};

export default UserDashboard;