import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styling/userDash.css';

// Placeholder components (we'll create these in Step 4)
const QuickActions = () => (
    <div className="dashboard-widget quick-actions">
        <h2>Quick Actions</h2>
        <button className="primary-btn">File New Complaint</button>
        <button className="secondary-btn">View All Complaints</button>
    </div>
);

const ComplaintSummary = () => (
    <div className="dashboard-widget complaint-summary">
        <h2>Complaint Summary</h2>
        <div className="summary-grid">
            <div className="summary-item total">Total: <span>15</span></div>
            <div className="summary-item pending">Pending: <span>5</span></div>
            <div className="summary-item in-progress">In Progress: <span>7</span></div>
            <div className="summary-item resolved">Resolved: <span>3</span></div>
        </div>
    </div>
);


const NotificationsDisplay = () => (
    <div className="dashboard-widget notifications">
        <h2>Notifications</h2>
        <ul>
            <li>Your complaint #001 has been assigned to Dept. X (1 hour ago)</li>
            <li>New system update available. (yesterday)</li>
        </ul>
    </div>
);


const UserDashboard = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token'); // Remove the JWT token
        // Optionally remove other user data from localStorage
        navigate('/login'); // Redirect to login page
    };

    // Basic check for authentication (will be enhanced with proper middleware/context later)
    if (!localStorage.getItem('token')) {
        navigate('/login'); // Redirect if no token
        return null; // Don't render anything
    }

    return (
        <div className="user-dashboard-container">
            {/* Sidebar */}
            <nav className="dashboard-sidebar">
                <div className="sidebar-header">
                    <h2>Complaint System</h2>
                </div>
                <ul className="sidebar-links">
                    <li><Link to="/dashboard">Dashboard</Link></li>
                    <li><Link to="/file-complaint">File Complaint</Link></li>
                    <li><Link to="/complaint-status">Complaint Status</Link></li>
                    <li><Link to="/profile">Profile</Link></li>
                    <li><Link to="/notifications">Notifications</Link></li>
                    <li><Link to="/settings">Settings</Link></li>
                    <li><button onClick={handleLogout} className="logout-btn">Logout</button></li>
                </ul>
            </nav>

            {/* Main Content */}
            <main className="dashboard-main-content">
                <header className="main-content-header">
                    <h1>Welcome, User!</h1> {/* This will dynamically show the username later */}
                </header>

                <section className="dashboard-widgets-grid">
                    <QuickActions />
                    <ComplaintSummary />
                    <NotificationsDisplay />
                </section>
            </main>
        </div>
    );
};

export default UserDashboard;