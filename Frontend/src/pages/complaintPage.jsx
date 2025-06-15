// frontend/src/pages/ComplaintPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // NEW: Import useParams
import '../styling/complaintPage.css'; // Assuming you have this CSS file

const ComplaintPage = () => {
    const { id } = useParams(); // Get ID from URL for edit mode
    const navigate = useNavigate();

    // Determine if we are in edit mode
    const isEditMode = !!id; // True if ID exists, false otherwise

    const [formData, setFormData] = useState({
        title: '',
        department: '',
        description: '',
        status: 'Open', // Default status for new complaints
        priority: 'Medium', // Default priority for new complaints
        attachments: null // For file input
    });

    const [existingAttachments, setExistingAttachments] = useState([]); // To display/manage existing files during edit
    const [departments, setDepartments] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null); // For fetching initial complaint data in edit mode

    // --- Fetch Departments on Component Mount ---
    useEffect(() => {
        const fetchDepartments = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await fetch('http://localhost:4000/api/departments', { // Assuming this endpoint exists
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
                            department: complaint.department ? complaint.department._id : '', // Use _id for select
                            description: complaint.description || '',
                            status: complaint.status || 'Open',
                            priority: complaint.priority || 'Medium',
                            attachments: null // attachments input is cleared for new uploads
                        });
                        setExistingAttachments(complaint.attachments || []); // Store existing attachments to display
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
    }, [id, isEditMode, navigate]); // Depend on ID and edit mode

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
            attachments: e.target.files // FileList object
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

        // Create FormData object for mixed data (text + files)
        const complaintData = new FormData();
        complaintData.append('title', formData.title);
        complaintData.append('department', formData.department);
        complaintData.append('description', formData.description);
        complaintData.append('status', formData.status);
        complaintData.append('priority', formData.priority);

        // Append new attachments if selected
        if (formData.attachments) {
            for (let i = 0; i < formData.attachments.length; i++) {
                complaintData.append('attachments', formData.attachments[i]);
            }
        }
        // IMPORTANT: If you want to keep existing attachments AND add new ones,
        // your backend must support that by appending to the array, not replacing.
        // As per our current backend logic for PUT, if 'attachments' field is sent, it replaces.
        // So, if no new files are selected, we simply don't append 'attachments' field,
        // and the backend will keep the existing ones.

        const url = isEditMode
            ? `http://localhost:4000/api/complaints/${id}` // PUT for update
            : 'http://localhost:4000/api/complaints'; // POST for new

        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`
                    // IMPORTANT: Do NOT set 'Content-Type': 'multipart/form-data' here.
                    // The browser sets it automatically with the correct boundary when you use FormData.
                },
                body: complaintData,
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || (isEditMode ? 'Complaint updated successfully!' : 'Complaint filed successfully!'));
                setLoading(false);
                // Optionally clear form for new complaint after submission
                if (!isEditMode) {
                    setFormData({
                        title: '',
                        department: '',
                        description: '',
                        status: 'Open',
                        priority: 'Medium',
                        attachments: null
                    });
                    setExistingAttachments([]); // Clear existing attachments display
                }
                // Redirect to dashboard or complaint status page after a short delay
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

    if (loading && isEditMode) { // Show loading only for initial fetch in edit mode
        return <div className="complaint-page-container">Loading complaint data...</div>;
    }

    if (fetchError && isEditMode) { // Show error only for initial fetch in edit mode
        return <div className="complaint-page-container">Error: {fetchError}</div>;
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

                    {/* Display status and priority for both create and edit, but you might disable for create or only allow certain values */}
                    <div className="form-group">
                        <label htmlFor="status">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            // You might want to disable status change for non-admin users
                            // disabled={!isEditMode && true} // Example: disable if not in edit mode
                        >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option> {/* If Closed is an option */}
                            <option value="Unresolved">Unresolved</option> {/* If Unresolved is an option */}
                        </select>
                    </div>

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
                                            {/* Optionally add a button to remove individual attachments,
                                                but this would require backend support for partial removal. */}
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