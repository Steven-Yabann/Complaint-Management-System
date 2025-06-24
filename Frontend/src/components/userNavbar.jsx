// frontend/src/components/UserNavbar.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Only Link is needed here, useNavigate is in the parent
import '../styling/navbar.css'; // Assuming your nav styling is in here

const UserNavbar = ({ username, onLogout }) => {
    return (
        <nav className="dashboard-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-profile">
                    {/* Profile icon SVG */}
                    <svg className="profile-icon" viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    {/* Display username */}
                    <span className="profile-username">{username || 'User'}</span>
                </div>
            </div>
            <ul className="sidebar-links">
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/ComplaintPage">File Complaint</Link></li>
                <li><Link to="/viewComplaints">View Complaints</Link></li>
                <li><Link to="/profile">Profile</Link></li>
                <li><Link to="/notifications">Notifications</Link></li>
                <li><button onClick={onLogout} className="logout-btn">Logout</button></li>
            </ul>
        </nav>
    );
};

export default UserNavbar;