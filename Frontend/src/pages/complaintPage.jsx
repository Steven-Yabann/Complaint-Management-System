// frontend/src/pages/ComplaintPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import UserNavbar from '../components/userNavbar'; // Import the UserNavbar component
import '../styling/complaintPage.css'; // Keep component-specific styling
import '../styling/userDash.css'; // Import userDash.css for the main container and layout classes
import '../styling/navbar.css'; // Import navbar.css for the UserNavbar's styling

const ComplaintPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        title: '',
        department: '',
        description: '',
        status: 'Open',
        priority: 'Medium',
        attachments: null
    });

    const [existingAttachments, setExistingAttachments] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [username, setUsername] = useState('User'); // State to hold the username for the navbar

    // --- Complaint Title Suggestions ---
    const complaintTitleSuggestions = [
        "Internet Connection Issue",
        "Broken Furniture/Equipment",
        "Window/Glass Damage",
        "Water Leak/Plumbing Issue",
        "Lighting Problem",
        "Air Conditioning Malfunction",
        "Printer/Office Equipment Failure",
        "Elevator Malfunction",
        "Cleanliness/Hygiene Issue",
        "Pest Control Needed",
        "Security Concern",
        "Power Outage/Electrical Issue",
        "Heating System Problem",
        "Drainage Blockage",
        "Facility Maintenance Request",
    ];

    const handleTitleSuggestionClick = (suggestion) => {
        setFormData(prevData => ({
            ...prevData,
            title: suggestion
        }));
    };

    // Logout handler for the navbar
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username'); // Get username from localStorage
        if (storedUsername) {
            setUsername(storedUsername); // Set username for navbar
        }

        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const decodedToken = jwtDecode(token);
            setUserRole(decodedToken.role);
            const currentTime = Date.now() / 1000;
            if (decodedToken.exp < currentTime) {
                console.warn("Token expired. Please log in again.");
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                localStorage.removeItem('username'); // Clear username on token expiry
                navigate('/login');
            }
        } catch (e) {
            console.error("Error decoding token or token is invalid:", e);
            setUserRole('user'); // Default to 'user' if token is invalid
            localStorage.removeItem('token'); // Clear invalid token
            localStorage.removeItem('username'); // Clear username for invalid token
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchDepartments = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch('http://localhost:4000/api/departments', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setDepartments(data.data);
                } else {
                    console.error('Failed to fetch departments:', await response.json());
                }
            } catch (err) {
                console.error('Network error fetching departments:', err);
            }
        };
        fetchDepartments();
    }, [navigate]);

    useEffect(() => {
        if (isEditMode) {
            const fetchComplaintData = async () => {
                setLoading(true);
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                try {
                    const response = await fetch(`http://localhost:4000/api/complaints/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        const complaint = data.data;
                        setFormData({
                            title: complaint.title || '',
                            department: complaint.department ? complaint.department._id : '',
                            description: complaint.description || '',
                            status: complaint.status || 'Open',
                            priority: complaint.priority || 'Medium',
                            attachments: null
                        });
                        setExistingAttachments(complaint.attachments || []);
                    } else {
                        const errorData = await response.json();
                        setFetchError(errorData.message || 'Failed to load complaint for editing.');
                        console.error('Failed to fetch complaint for edit:', errorData);
                    }
                } catch (err) {
                    setFetchError('Network error: Could not load complaint data.');
                    console.error('Network error fetching complaint for edit:', err);
                } finally {
                    setLoading(false);
                }
            };
            fetchComplaintData();
        }
    }, [id, isEditMode, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e) => {
        setFormData({ ...formData, attachments: e.target.files });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        setIsSubmitted(false);
        const token = localStorage.getItem('token');

        if (!token) {
            setMessage('You must be logged in to file a complaint.');
            navigate('/login');
            setLoading(false);
            return;
        }

        const complaintData = new FormData();
        complaintData.append('title', formData.title);
        complaintData.append('department', formData.department);
        complaintData.append('description', formData.description);

        if (isEditMode && userRole === 'admin') {
            complaintData.append('status', formData.status);
        } else {
            complaintData.append('status', 'Open');
        }
        complaintData.append('priority', formData.priority);

        if (formData.attachments) {
            for (let i = 0; i < formData.attachments.length; i++) {
                complaintData.append('attachments', formData.attachments[i]);
            }
        }

        const url = isEditMode
            ? `http://localhost:4000/api/complaints/${id}`
            : 'http://localhost:4000/api/complaints';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: complaintData,
            });
            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || (isEditMode ? 'Complaint updated successfully!' : 'Complaint filed successfully!'));
                setLoading(false);
                if (!isEditMode) {
                    setIsSubmitted(true);
                    document.title = "Complaint Submitted!";
                    setTimeout(() => {
                        document.title = "File a Complaint";
                        navigate('/viewComplaints');
                    }, 2000);
                } else {
                    setTimeout(() => {
                        navigate('/viewComplaints');
                    }, 1500);
                }
            } else {
                setMessage(data.message || `Failed to ${isEditMode ? 'update' : 'file'} complaint.`);
                setLoading(false);
                setIsSubmitted(false);
                console.error('API Error:', data);
            }
        } catch (err) {
            setMessage('Network error: Could not connect to the server.');
            setLoading(false);
            setIsSubmitted(false);
            console.error('Network Error:', err);
        }
    };

    if (loading && isEditMode) {
        return (
            <div className="user-dashboard-container"> {/* Use the container for consistency */}
                <UserNavbar username={username} onLogout={handleLogout} />
                <main className="dashboard-main-content">
                    <div className="loading-state">Loading complaint data...</div>
                </main>
            </div>
        );
    }

    if (fetchError && isEditMode) {
        return (
            <div className="user-dashboard-container"> {/* Use the container for consistency */}
                <UserNavbar username={username} onLogout={handleLogout} />
                <main className="dashboard-main-content">
                    <div className="error-state">Error: {fetchError}</div>
                </main>
            </div>
        );
    }

    if (userRole === null) {
        return (
            <div className="user-dashboard-container"> {/* Use the container for consistency */}
                <UserNavbar username={username} onLogout={handleLogout} />
                <main className="dashboard-main-content">
                    <div className="loading-state">Loading user role...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="user-dashboard-container">
            {/* Render the UserNavbar component here */}
            <UserNavbar username={username} onLogout={handleLogout} />

            <main className="dashboard-main-content">
                <div className="main-content-header">
                    <h1>{isEditMode ? 'Edit Complaint' : 'File a New Complaint'}</h1>
                </div>

                <div className="complaint-form-wrapper dashboard-widget">
                    {message && (
                        <div className={`form-message ${message.includes('successful') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}
                    {loading && !isEditMode && !isSubmitted && (
                        <div className="submission-status">
                            <div className="spinner"></div>
                            Submitting Complaint...
                        </div>
                    )}
                    {isSubmitted && !isEditMode && (
                        <div className="submission-status success-checkbox">
                            <span className="checkbox-icon">&#10003;</span>
                            Complaint Submitted! Redirecting...
                        </div>
                    )}

                    {(!isSubmitted || isEditMode) && (
                        <form onSubmit={handleSubmit} className="complaint-form" encType="multipart/form-data">
                            <div className="form-group">
                                <label htmlFor="title">Complaint Title</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                                {!isEditMode && (
                                    <div className="suggestions-container">
                                        <strong>Common Titles:</strong>
                                        <div className="suggestion-buttons">
                                            {complaintTitleSuggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    type="button"
                                                    className="suggestion-btn"
                                                    onClick={() => handleTitleSuggestionClick(suggestion)}
                                                >
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="info-text">Click to use a common title. You can still type your own.</p>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="department">Department</label>
                                <select
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept._id} value={dept._id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    rows="5"
                                ></textarea>
                            </div>

                            {isEditMode && userRole === 'admin' && (
                                <div className="form-group">
                                    <label htmlFor="status">Status</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                        <option value="Closed">Closed</option>
                                        <option value="Unresolved">Unresolved</option>
                                    </select>
                                </div>
                            )}
                            {isEditMode && userRole !== 'admin' && (
                                <div className="form-group">
                                    <label>Status</label>
                                    <p className="form-static-value">{formData.status}</p>
                                </div>
                            )}
                            {!isEditMode && (
                                <div className="form-group">
                                    <label>Status</label>
                                    <p className="form-static-value">Open (Default)</p>
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="priority">Priority</label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Urgent">Urgent</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="attachments">Attachments</label>
                                <input
                                    type="file"
                                    id="attachments"
                                    name="attachments"
                                    multiple
                                    onChange={handleFileChange}
                                />
                                {isEditMode && existingAttachments.length > 0 && (
                                    <div className="existing-attachments">
                                        <h4>Existing Attachments:</h4>
                                        <ul>
                                            {existingAttachments.map((att, index) => (
                                                <li key={index}>
                                                    <a href={`http://localhost:4000${att.filepath.split('public')[1]}`} target="_blank" rel="noopener noreferrer">
                                                        {att.filename}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="info-text">Uploading new files will replace existing ones (backend behavior).</p>
                                    </div>
                                )}
                                {isEditMode && existingAttachments.length === 0 && (
                                    <p className="info-text">No existing attachments. Upload new ones if needed.</p>
                                )}
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading || isSubmitted}>
                                {loading && !isSubmitted ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Complaint' : 'File Complaint')}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ComplaintPage;