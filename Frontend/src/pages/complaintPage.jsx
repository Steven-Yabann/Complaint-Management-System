// frontend/src/pages/ComplaintPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode
import '../styling/complaintPage.css';

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
    const [userRole, setUserRole] = useState(null); // Still null initially

    // --- Fetch User Role on Component Mount by decoding JWT ---
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Decode the token to get user information, including the role
            const decodedToken = jwtDecode(token);
            setUserRole(decodedToken.role); // Assuming your JWT payload has a 'role' field

            // Optional: Check token expiry
            const currentTime = Date.now() / 1000; // in seconds
            if (decodedToken.exp < currentTime) {
                // Token expired, handle logout or refresh
                console.warn("Token expired. Please log in again.");
                localStorage.removeItem('token');
                localStorage.removeItem('userRole'); // Clear any stored role too
                navigate('/login');
            }

        } catch (e) {
            console.error("Error decoding token or token is invalid:", e);
            // If token is invalid or decoding fails, assume 'user' role or log out
            setUserRole('user'); // Default to a non-admin role if token is problematic
            // Optionally, force logout if token is truly invalid
            // localStorage.removeItem('token');
            // localStorage.removeItem('userRole');
            // navigate('/login');
        }
    }, [navigate]); // Depend on navigate

    // --- Rest of your useEffects and functions remain the same ---
    // --- Fetch Departments on Component Mount ---
    useEffect(() => {
        const fetchDepartments = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch('http://localhost:4000/api/departments', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
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

    // --- Fetch Complaint Data if in Edit Mode ---
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
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
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
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            attachments: e.target.files
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
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

        // --- Modified Status Logic based on role ---
        if (isEditMode && userRole === 'admin') { // Only admins can change status when editing
            complaintData.append('status', formData.status);
        } else {
            // For new complaints, or for users editing, status is always 'Open'
            complaintData.append('status', 'Open');
        }
        // --- End Modified Status Logic ---

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
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: complaintData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || (isEditMode ? 'Complaint updated successfully!' : 'Complaint filed successfully!'));
                setLoading(false);
                if (!isEditMode) {
                    setFormData({
                        title: '',
                        department: '',
                        description: '',
                        status: 'Open',
                        priority: 'Medium',
                        attachments: null
                    });
                    setExistingAttachments([]);
                }
                setTimeout(() => {
                    navigate('/viewComplaints');
                }, 1500);
            } else {
                setMessage(data.message || `Failed to ${isEditMode ? 'update' : 'file'} complaint.`);
                setLoading(false);
                console.error('API Error:', data);
            }
        } catch (err) {
            setMessage('Network error: Could not connect to the server.');
            setLoading(false);
            console.error('Network Error:', err);
        }
    };

    if (loading && isEditMode) {
        return <div className="complaint-page-container">Loading complaint data...</div>;
    }

    if (fetchError && isEditMode) {
        return <div className="complaint-page-container">Error: {fetchError}</div>;
    }

    // Crucial: Only render the form once userRole is determined
    if (userRole === null) {
        return <div className="complaint-page-container">Loading user role...</div>;
    }


    return (
        <div className="complaint-page-container">
            <div className="complaint-form-wrapper">
                <h2>{isEditMode ? 'Edit Complaint' : 'File a New Complaint'}</h2>
                {message && (
                    <div className={`form-message ${message.includes('successful') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}
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

                    {/* Only show Status dropdown if in edit mode AND user is an admin */}
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
                    {/* Display status as plain text if in edit mode but not admin */}
                    {isEditMode && userRole !== 'admin' && (
                        <div className="form-group">
                            <label>Status</label>
                            <p className="form-static-value">{formData.status}</p>
                        </div>
                    )}
                    {/* For new complaints, status is always "Open", no need to show anything */}
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

                    {/* Attachment handling */}
                    <div className="form-group">
                        <label htmlFor="attachments">Attachments</label>
                        <input
                            type="file"
                            id="attachments"
                            name="attachments"
                            multiple
                            onChange={handleFileChange}
                        />
                        {/* Display existing attachments in edit mode */}
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

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? (isEditMode ? 'Updating...' : 'Submitting...') : (isEditMode ? 'Update Complaint' : 'File Complaint')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ComplaintPage;