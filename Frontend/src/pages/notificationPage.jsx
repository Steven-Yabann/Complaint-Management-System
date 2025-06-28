// frontend/src/pages/NotificationPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, } from 'react-router-dom';
import UserNavbar from '../components/userNavbar'; // Import Navbar
import FeedbackModal from '../components/feedbackModal'; // Import the new FeedbackModal
import '../styling/userDash.css'; // For general layout classes
import '../styling/navbar.css'; // For Navbar styling
import '../styling/notification.css'; // Specific styling for this page and modal

/**
 * NotificationPage component displays a list of notifications for the authenticated user.
 * It allows marking notifications as read and providing feedback for resolved complaints.
 */
const NotificationPage = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState('User'); // For UserNavbar
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedComplaintForFeedback, setSelectedComplaintForFeedback] = useState(null);
    const [selectedNotificationId, setSelectedNotificationId] = useState(null);

    // Logout handler for the navbar
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    
    /**
     * Fetches notifications for the logged-in user.
     */
    const fetchNotifications = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/notifications/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data.data);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch notifications.');
                console.error('Error fetching notifications:', errorData);
            }
        } catch (err) {
            setError('Network error: Could not connect to the server to fetch notifications.');
            console.error('Network error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
        fetchNotifications();
    }, [navigate]); // Re-fetch if navigate changes (e.g., coming from login)

    /**
     * Marks a notification as read and potentially opens the feedback modal.
     * @param {string} notificationId - The ID of the notification to mark as read.
     * @param {object} complaintDetails - The complaint object associated with the notification.
     */
    const handleNotificationClick = async (notificationId, complaintDetails) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Mark notification as read
            const response = await fetch(`http://localhost:4000/api/notifications/${notificationId}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Update the notification in state to reflect it's read
                setNotifications(prev =>
                    prev.map(notif =>
                        notif._id === notificationId ? { ...notif, isRead: true } : notif
                    )
                );
                // If it's a status update notification for Resolved/Closed and feedback hasn't been given
                if (complaintDetails &&
                    (complaintDetails.status === 'Resolved' || complaintDetails.status === 'Closed') &&
                    // Ensure the notification itself indicates feedback hasn't been given yet
                    notifications.find(n => n._id === notificationId && !n.feedbackGiven)) {
                    
                    setSelectedComplaintForFeedback(complaintDetails);
                    setSelectedNotificationId(notificationId);
                    setShowFeedbackModal(true);
                } else {
                    // Optional: navigate to complaint details page if not for feedback
                    // navigate(`/complaint/${complaintDetails._id}`);
                }
            } else {
                console.error('Failed to mark notification as read:', await response.json());
            }
        } catch (err) {
            console.error('Network error marking notification as read:', err);
        }
    };

    /**
     * Callback function when feedback is successfully submitted from the modal.
     * Updates the notification's feedbackGiven status.
     */
    const handleFeedbackSubmitted = async () => {
        // After feedback, mark the specific notification as feedbackGiven: true
        setNotifications(prev =>
            prev.map(notif =>
                notif._id === selectedNotificationId ? { ...notif, feedbackGiven: true } : notif
            )
        );
        setShowFeedbackModal(false);
        setSelectedComplaintForFeedback(null);
        setSelectedNotificationId(null);
    };


    // Conditional rendering for loading and error states
    if (loading) {
        return (
            <div className="user-dashboard-container">
                <UserNavbar username={username} onLogout={handleLogout} />
                <main className="dashboard-main-content">
                    <div className="loading-state">Loading notifications...</div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-dashboard-container">
                <UserNavbar username={username} onLogout={handleLogout} />
                <main className="dashboard-main-content">
                    <div className="error-state">Error: {error}</div>
                </main>
            </div>
        );
    }

    return (
        <div className="user-dashboard-container">
            <UserNavbar username={username} onLogout={handleLogout} />

            <main className="dashboard-main-content">
                <header className="main-content-header">
                    <h1>Your Notifications</h1>
                </header>

                <div className="notifications-list-container dashboard-widget">
                    {notifications.length === 0 ? (
                        <p className="no-notifications-message">You have no new notifications.</p>
                    ) : (
                        <ul className="notifications-list">
                            {notifications.map(notification => (
                                <li
                                    key={notification._id}
                                    className={`notification-item ${notification.isRead ? 'read' : 'unread'} ${notification.feedbackGiven ? 'feedback-done' : ''}`}
                                    onClick={() => handleNotificationClick(notification._id, notification.complaint)}
                                >
                                    <div className="notification-content">
                                        <span className="notification-message">{notification.message}</span>
                                        <span className="notification-date">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="notification-actions">
                                        {!notification.isRead && (
                                            <span className="new-badge">NEW</span>
                                        )}
                                        {notification.complaint &&
                                            (notification.complaint.status === 'Resolved' || notification.complaint.status === 'Closed') &&
                                            !notification.feedbackGiven && (
                                                <button
                                                    className="feedback-btn"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent parent li click
                                                        setSelectedComplaintForFeedback(notification.complaint);
                                                        setSelectedNotificationId(notification._id);
                                                        setShowFeedbackModal(true);
                                                    }}
                                                >
                                                    Provide Feedback
                                                </button>
                                            )}
                                        {notification.feedbackGiven && (
                                            <span className="feedback-done-badge">Feedback Given!</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </main>

            {showFeedbackModal && selectedComplaintForFeedback && (
                <FeedbackModal
                    complaint={selectedComplaintForFeedback}
                    notificationId={selectedNotificationId}
                    onClose={() => setShowFeedbackModal(false)}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                />
            )}
        </div>
    );
};

export default NotificationPage;