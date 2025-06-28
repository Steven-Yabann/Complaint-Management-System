// frontend/src/pages/viewComplaints.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode to check token validity

import UserNavbar from '../components/userNavbar'; // Import the UserNavbar component
import '../styling/viewComplaints.css'; // Page-specific styling for the complaints table
import '../styling/userDash.css';    // For the main layout container and main content area
import '../styling/navbar.css';      // For the UserNavbar's styling

const ViewComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [username, setUsername] = useState('User'); // State for username for the navbar
    const [showConfirmModal, setShowConfirmModal] = useState(false); // State for custom confirmation modal
    const [complaintToDelete, setComplaintToDelete] = useState(null); // State to store ID of complaint to delete

    // Function to handle logout, passed to UserNavbar
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    // Function to fetch complaints - now reusable after delete/edit
    const fetchComplaints = async () => {
        const token = localStorage.getItem('token');

        // Check for token existence and validity before fetching data
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000;
            if (decodedToken.exp < currentTime) {
                console.warn("Token expired. Please log in again.");
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                navigate('/login');
                return;
            }
        } catch (e) {
            console.error("Error decoding token or token is invalid:", e);
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('http://localhost:4000/api/complaints/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setComplaints(data.data);
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to fetch complaints.');
                console.error('Failed to fetch complaints:', errorData);
            }
        } catch (err) {
            setError('Network error: Could not connect to the server.');
            console.error('Network error fetching complaints:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername); // Set username for navbar
        }
        fetchComplaints();
    }, [navigate]); // Dependency array: re-run if navigate changes

    

    const getStatusClassName = (status) => {
        switch (status) {
            case 'Open':
                return 'status-open'; // Red
            case 'In Progress':
                return 'status-in-progress'; // Orange
            case 'Resolved':
                return 'status-resolved'; // Green
            case 'Closed':
                return 'status-resolved'; // Green
            case 'Unresolved':
                return 'status-unresolved'; // Red
            default:
                return 'status-default'; // Default styling
        }
    };

    const handleEdit = (complaintId) => {
        console.log(`Navigating to edit complaint: /ComplaintPage/${complaintId}`);
        navigate(`/ComplaintPage/${complaintId}`);
    };

    // Function to open the confirmation modal
    const confirmDelete = (complaintId) => {
        setComplaintToDelete(complaintId);
        setShowConfirmModal(true);
    };

    // Function to actually perform the delete after confirmation
    const handleDeleteConfirmed = async () => {
        setShowConfirmModal(false); // Close the modal
        if (!complaintToDelete) return; // Should not happen if modal is shown correctly

        console.log(`Attempting to delete complaint: ${complaintToDelete}`);
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found, redirecting to login.');
            navigate('/login');
            return;
        }

        try {
            setLoading(true); // Show loading state while deleting
            const response = await fetch(`http://localhost:4000/api/complaints/${complaintToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                console.log('Complaint deleted successfully!');
                setComplaints(prevComplaints => prevComplaints.filter(comp => comp._id !== complaintToDelete));
                setError(null); // Clear any previous error messages
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to delete complaint.');
                console.error('Failed to delete complaint:', errorData);
            }
        } catch (err) {
            setError('Network error: Could not connect to the server.');
            console.error('Network Error during delete:', err);
        } finally {
            setLoading(false); // Hide loading state
            setComplaintToDelete(null); // Clear the ID
        }
    };

    // Close modal function
    const handleCancelDelete = () => {
        setShowConfirmModal(false);
        setComplaintToDelete(null);
    };


    // Render loading and error states within the consistent layout
    if (loading) {
        return (
            <div className="user-dashboard-container">
                <UserNavbar username={username} onLogout={handleLogout} />
                <main className="dashboard-main-content">
                    <div className="loading-state">Loading complaints...</div>
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
        // The main layout container that arranges sidebar and main content
        <div className="user-dashboard-container">
            {/* Render the UserNavbar component, passing username and logout handler */}
            <UserNavbar username={username} onLogout={handleLogout} />

            {/* The main content area where your complaints table resides */}
            <main className="dashboard-main-content">
                <header className="main-content-header">
                    <h1>My Complaints</h1>
                </header>

                {/* Removed the 'Go to Dashboard' link as it's now in the navbar */}
                {/* <div className="dashboard-link-container">
                    <Link to="/dashboard" className="btn btn-primary dashboard-link">Go to Dashboard</Link>
                </div> */}

                {complaints.length === 0 ? (
                    <p className="no-complaints-message">You haven't filed any complaints yet. <Link to="/ComplaintPage">File a new one</Link>.</p>
                ) : (
                    <div className="complaints-table-wrapper dashboard-widget"> {/* Added dashboard-widget for consistent styling */}
                        <table className="complaints-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Department</th>
                                    <th>Status</th>
                                    <th>Date Filed</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {complaints.map(complaint => (
                                    <tr key={complaint._id}>
                                        <td>{complaint.title}</td>
                                        <td>{complaint.description}</td>
                                        <td>{complaint.department ? complaint.department.name : 'N/A'}</td>
                                        <td>
                                            <span className={`status-pill ${getStatusClassName(complaint.status)}`}>
                                                {complaint.status}
                                            </span>
                                        </td>
                                        <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                                        <td className="actions-cell">
                                            <button
                                                className="action-btn edit-btn"
                                                onClick={() => handleEdit(complaint._id)}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="action-btn delete-btn"
                                                onClick={() => confirmDelete(complaint._id)} // Call confirmDelete
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Custom Confirmation Modal */}
            {showConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete this complaint? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={handleCancelDelete}>Cancel</button>
                            <button className="btn-confirm" onClick={handleDeleteConfirmed}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewComplaints;