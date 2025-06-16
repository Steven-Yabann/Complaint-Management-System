// frontend/src/pages/viewComplaints.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Ensure Link is imported
import '../styling/viewComplaints.css'; // Make sure this path is correct

const ViewComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Corrected: was `useState = useState(null)`
    const navigate = useNavigate();

    // Function to fetch complaints - now reusable after delete/edit
    const fetchComplaints = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
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
            case 'Closed': // Assuming 'Closed' is also green/resolved
                return 'status-resolved'; // Green
            case 'Unresolved': // If you have an explicit 'Unresolved' status, make it red
                return 'status-unresolved'; // Red
            default:
                return 'status-default'; // Default styling
        }
    };

    const handleEdit = (complaintId) => {
        // Navigate to the ComplaintPage with the complaint ID as a URL parameter
        console.log(`Navigating to edit complaint: /ComplaintPage/${complaintId}`); // Added for debugging
        navigate(`/ComplaintPage/${complaintId}`);
    };

    const handleDelete = async (complaintId) => {
        console.log(`Attempting to delete complaint: ${complaintId}`); // Added for debugging
        if (!window.confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
            console.log('Delete cancelled by user.'); // Added for debugging
            return; // User cancelled
        }

        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found, redirecting to login.'); // Added for debugging
            navigate('/login');
            return;
        }

        try {
            setLoading(true); // Show loading state while deleting
            const response = await fetch(`http://localhost:4000/api/complaints/${complaintId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                console.log('Complaint deleted successfully!');
                // Remove the deleted complaint from the state to update the UI
                setComplaints(prevComplaints => prevComplaints.filter(comp => comp._id !== complaintId));
                // Optionally, refetch complaints to ensure data consistency if backend doesn't return updated list
                // fetchComplaints();
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to delete complaint.');
                console.error('Failed to delete complaint:', errorData); // Log detailed error from backend
            }
        } catch (err) {
            setError('Network error: Could not connect to the server.');
            console.error('Network Error during delete:', err); // Log network error
        } finally {
            setLoading(false); // Hide loading state
        }
    };


    if (loading) {
        return <div className="complaint-status-container">Loading complaints...</div>;
    }

    if (error) {
        return <div className="complaint-status-container">Error: {error}</div>;
    }

    return (
        <div className="complaint-status-container">
            <div className="dashboard-link-container">
                <Link to="/dashboard" className="btn btn-primary dashboard-link">Go to Dashboard</Link>
            </div>
            <h1>My Complaints</h1>
            {complaints.length === 0 ? (
                <p>You haven't filed any complaints yet. <Link to="/ComplaintPage">File a new one</Link>.</p>
            ) : (
                <div className="complaints-table-wrapper">
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
                                            onClick={() => handleDelete(complaint._id)}
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
        </div>
    );
};

export default ViewComplaints;