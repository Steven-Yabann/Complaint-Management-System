import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styling/complaintPage.css'; 

const ComplaintPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        department: '', 
        description: '',
        status: 'Open', 
        priority: 'Low',
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [departments, setDepartments] = useState([]); // To store fetched departments
    const [errors, setErrors] = useState({});
    const [submitMessage, setSubmitMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [complaintId, setComplaintId] = useState('');

    const MAX_FILES = 5;
    const MAX_FILE_SIZE_MB = 10; // Total size
    const MAX_DESCRIPTION_LENGTH = 500; // Example length from wireframe, adjust as needed

    // --- Fetch Departments on Component Mount ---
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/departments', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setDepartments(data.data);
                } else {
                    console.error('Failed to fetch departments:', response.statusText);
                    setErrors(prev => ({ ...prev, department: 'Could not load departments.' }));
                }
            } catch (error) {
                console.error('Network error fetching departments:', error);
                setErrors(prev => ({ ...prev, department: 'Network error loading departments.' }));
            }
        };
        fetchDepartments();
    }, []); // Empty dependency array means this runs once on mount

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for the field being changed
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSmartSuggestion = (suggestion) => {
        setFormData(prev => ({ ...prev, title: suggestion }));
        setErrors(prev => ({ ...prev, title: '' }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const newFiles = [...selectedFiles];
        let currentTotalSize = newFiles.reduce((acc, file) => acc + file.size, 0); // Bytes

        files.forEach(file => {
            if (newFiles.length < MAX_FILES) {
                if ((currentTotalSize + file.size) / (1024 * 1024) <= MAX_FILE_SIZE_MB) {
                    newFiles.push(file);
                    currentTotalSize += file.size;
                } else {
                    setErrors(prev => ({ ...prev, files: `Total file size cannot exceed ${MAX_FILE_SIZE_MB}MB.` }));
                }
            } else {
                setErrors(prev => ({ ...prev, files: `You can upload a maximum of ${MAX_FILES} files.` }));
            }
        });
        setSelectedFiles(newFiles);
        e.target.value = null; // Clear the input so same file can be selected again
        setErrors(prev => ({ ...prev, files: '' })); // Clear file error on new selection
    };

    const handleRemoveFile = (index) => {
        const newFiles = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(newFiles);
        setErrors(prev => ({ ...prev, files: '' })); // Clear any previous file errors
    };

    const validateForm = () => {
        let newErrors = {};
        let isValid = true;

        if (!formData.title.trim()) {
            newErrors.title = 'Complaint Title is required.';
            isValid = false;
        }
        if (!formData.department) {
            newErrors.department = 'Department/Building is required.';
            isValid = false;
        }
        if (!formData.description.trim()) {
            newErrors.description = 'Complaint Details are required.';
            isValid = false;
        } else if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
            newErrors.description = `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`;
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitMessage('');
        setErrors({}); // Clear previous errors

        if (!validateForm()) {
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            setSubmitMessage('You are not authenticated. Please log in.');
            navigate('/login');
            return;
        }

        const complaintData = new FormData();
        complaintData.append('title', formData.title);
        complaintData.append('department', formData.department);
        complaintData.append('description', formData.description);
        complaintData.append('status', formData.status);
        complaintData.append('priority', formData.priority); // Include priority

        selectedFiles.forEach((file) => {
            complaintData.append('attachments', file); // Append each file
        });

        try {
            const response = await fetch('http://localhost:4000/api/complaints', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    // 'Content-Type': 'multipart/form-data' is NOT set here.
                    // fetch does it automatically when using FormData.
                },
                body: complaintData,
            });

            const data = await response.json();

            if (response.ok) {
                setComplaintId(data.complaintId || 'Unknown');
                setShowSuccessModal(true);
                // Optionally clear the form after success
                setFormData({
                    title: '',
                    department: '',
                    description: '',
                    status: 'Open',
                    priority: 'Low',
                });
                setSelectedFiles([]);
            } else {
                setSubmitMessage(data.message || 'Failed to submit complaint. Please try again.');
                console.error('Complaint submission error:', data);
            }
        } catch (error) {
            setSubmitMessage('Network error. Could not submit complaint.');
            console.error('Network error during complaint submission:', error);
        }
    };

    return (
        <div className="file-complaint-container">
            <header className="complaint-header">
                <h1>File New Complaint</h1>
                <Link to="/dashboard" className="back-to-dashboard-btn">Back to Dashboard</Link>
            </header>

            <form className="complaint-form" onSubmit={handleSubmit}>
                {submitMessage && (
                    <div className={`message ${submitMessage.includes('success') ? 'success' : 'error'}`}>
                        {submitMessage}
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="title">Complaint Title</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        placeholder="E.g., Broken chair in Lecture Hall 5"
                        value={formData.title}
                        onChange={handleChange}
                        className={errors.title ? 'input-error' : ''}
                    />
                    {errors.title && <span className="error-text">{errors.title}</span>}
                </div>

                <div className="form-group">
                    <label>Smart Suggestions</label>
                    <div className="smart-suggestions">
                        <button type="button" onClick={() => handleSmartSuggestion('Wi-Fi Connectivity Issue')}>Wi-Fi Connectivity Issue</button>
                        <button type="button" onClick={() => handleSmartSuggestion('Electrical Problem')}>Electrical Problem</button>
                        <button type="button" onClick={() => handleSmartSuggestion('Sanitation Complaint')}>Sanitation Complaint</button>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="department">Department/Building</label>
                    <select
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className={errors.department ? 'input-error' : ''}
                    >
                        <option value="">Select Building/Department</option>
                        {departments.map(dept => (
                            <option key={dept._id} value={dept._id}>{dept.name}</option>
                        ))}
                    </select>
                    {errors.department && <span className="error-text">{errors.department}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="description">Complaint Details</label>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Describe your issue in detail..."
                        value={formData.description}
                        onChange={handleChange}
                        maxLength={MAX_DESCRIPTION_LENGTH}
                        className={errors.description ? 'input-error' : ''}
                    ></textarea>
                    <div className="char-count">
                        {formData.description.length} / {MAX_DESCRIPTION_LENGTH}
                    </div>
                    {errors.description && <span className="error-text">{errors.description}</span>}
                </div>

                <div className="form-group">
                    <label>Attachments</label>
                    <div className="file-upload-area">
                        <label htmlFor="file-input" className="file-upload-label">
                            <svg className="upload-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                            </svg>
                            Upload images/PDF (max {MAX_FILES} files, {MAX_FILE_SIZE_MB}MB total) *optional*
                            <input
                                type="file"
                                id="file-input"
                                multiple
                                accept="image/*,application/pdf"
                                onChange={handleFileChange}
                                style={{ display: 'none' }} 
                            />
                        </label>
                        {selectedFiles.length > 0 && (
                            <div className="selected-files-list">
                                {selectedFiles.map((file, index) => (
                                    <div key={index} className="selected-file-item">
                                        <span>{file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                                        <button type="button" onClick={() => handleRemoveFile(index)} className="remove-file-btn">
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {errors.files && <span className="error-text">{errors.files}</span>}
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="cancel-btn" onClick={() => navigate('/dashboard')}>Cancel</button>
                    <button type="submit" className="submit-btn">Submit Complaint</button>
                </div>
            </form>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="success-modal-overlay">
                    <div className="success-modal-content">
                        <svg className="checkmark" viewBox="0 0 52 52">
                            <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                            <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                        </svg>
                        <h3>Complaint #{complaintId} submitted!</h3>
                        <p>You'll receive updates via email.</p>
                        <p>Track status in your dashboard.</p>
                        <button className="primary-btn" onClick={() => { setShowSuccessModal(false); navigate('/dashboard'); }}>
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComplaintPage;