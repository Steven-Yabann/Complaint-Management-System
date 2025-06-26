// frontend/src/components/UserNavbar.jsx
import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import { Link, } from 'react-router-dom'; // Import useNavigate if not already in parent, or ensure parent passes handleLogout
import '../styling/navbar.css'; // Assuming your nav styling is in here

/**
 * UserNavbar component provides the sidebar navigation for user dashboards.
 * It includes links to various sections, a logout button, and a real-time
 * unread notification count.
 * @param {object} props - The component props.
 * @param {string} props.username - The username to display in the sidebar header.
 * @param {function} props.onLogout - The function to call when the logout button is clicked.
 */
const UserNavbar = ({ username, onLogout }) => {
    // State to hold the count of unread notifications
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

    // Effect to fetch the unread notification count when the component mounts
    // and to set up polling for real-time updates.
    useEffect(() => {
        /**
         * Asynchronously fetches the count of unread notifications from the backend.
         * Updates the `unreadNotificationCount` state.
         */
        const fetchUnreadCount = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                // If no token exists, the user is not logged in, so there are no notifications to fetch.
                setUnreadNotificationCount(0);
                return;
            }

            try {
                // Make a GET request to the backend API endpoint for unread notification count
                const response = await fetch('http://localhost:4000/api/notifications/unread/count', {
                    headers: {
                        'Authorization': `Bearer ${token}` // Send authorization token
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUnreadNotificationCount(data.count); // Update state with the fetched count
                } else {
                    // Log error if fetching fails, and reset count
                    console.error('Failed to fetch unread notification count:', await response.json());
                    setUnreadNotificationCount(0);
                }
            } catch (err) {
                // Log network errors, and reset count
                console.error('Network error fetching unread notification count:', err);
                setUnreadNotificationCount(0);
            }
        };

        fetchUnreadCount(); // Fetch count immediately on component mount

        // Optional: Set up polling to periodically refresh the unread count.
        // This provides a near real-time update experience without needing WebSockets.
        const intervalId = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds (adjust as needed)

        // Cleanup function: This runs when the component unmounts
        // to clear the interval and prevent memory leaks.
        return () => clearInterval(intervalId);
    }, []); // Empty dependency array means this effect runs only once on mount and cleans up on unmount.

    return (
        <nav className="dashboard-sidebar">
            <div className="sidebar-header">
                <div className="sidebar-profile">
                    {/* Profile icon SVG (assuming you have this inline SVG) */}
                    <svg className="profile-icon" viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    {/* Display username, fallback to 'User' if not provided */}
                    <span className="profile-username">{username || 'User'}</span>
                </div>
            </div>
            <ul className="sidebar-links">
                {/* Navigation links */}
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/ComplaintPage">File Complaint</Link></li>
                <li><Link to="/viewComplaints">View Complaints</Link></li>
                <li><Link to="/profile">Profile</Link></li>
                {/* Notifications link with conditional badge */}
                <li>
                    <Link to="/notifications" className="notification-link">
                        Notifications
                        {/* Display badge only if there are unread notifications */}
                        {unreadNotificationCount > 0 && (
                            <span className="notification-badge">{unreadNotificationCount}</span>
                        )}
                    </Link>
                </li>
                {/* Logout button, triggers onLogout function passed from parent */}
                <li><button onClick={onLogout} className="logout-btn">Logout</button></li>
            </ul>
        </nav>
    );
};

export default UserNavbar;