// Frontend/src/pages/ComplaintDetails.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styling/complaintDetails.css';

const ComplaintDetails = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [complaint, setComplaint] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [userRole, setUserRole] = useState(null);
	const [updating, setUpdating] = useState(false);
	const [statusUpdateMessage, setStatusUpdateMessage] = useState('');

	useEffect(() => {
		const token = localStorage.getItem('token');
		const role = localStorage.getItem('userRole');
		setUserRole(role);

		if (!token) {
			navigate('/login');
			return;
		}

		const fetchComplaintDetails = async () => {
			try {
				const response = await fetch(`http://localhost:4000/api/complaints/${id}`, {
					headers: {
						'Authorization': `Bearer ${token}`
					}
				});

				if (response.ok) {
					const data = await response.json();
					setComplaint(data.data);
				} else {
					const errorData = await response.json();
					setError(errorData.message || 'Failed to fetch complaint details.');
				}
			} catch (err) {
				setError('Network error: Could not connect to the server.');
				console.error('Error fetching complaint details:', err);
			} finally {
				setLoading(false);
			}
		};

		fetchComplaintDetails();
	}, [id, navigate]);

	const handleStatusUpdate = async (newStatus) => {
		if (!userRole || userRole !== 'admin') {
			setStatusUpdateMessage('Only administrators can update complaint status.');
			return;
		}

		setUpdating(true);
		setStatusUpdateMessage('');
		const token = localStorage.getItem('token');

		try {
			const response = await fetch(`http://localhost:4000/api/complaints/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify({ status: newStatus })
			});

			if (response.ok) {
				setComplaint(prev => ({ ...prev, status: newStatus }));
				setStatusUpdateMessage('Status updated successfully!');
				setTimeout(() => setStatusUpdateMessage(''), 3000);
			} else {
				const errorData = await response.json();
				setStatusUpdateMessage(errorData.message || 'Failed to update status.');
			}
		} catch (err) {
			setStatusUpdateMessage('Network error: Could not update status.');
			console.error('Error updating status:', err);
		} finally {
			setUpdating(false);
		}
	};

	const getStatusColor = (status) => {
		switch (status?.toLowerCase()) {
			case 'open': return 'status-open';
			case 'in progress': case 'in-progress': return 'status-in-progress';
			case 'resolved': case 'closed': return 'status-resolved';
			default: return 'status-open';
		}
	};

	const getPriorityColor = (priority) => {
		switch (priority?.toLowerCase()) {
			case 'low': return 'priority-low';
			case 'medium': return 'priority-medium';
			case 'high': return 'priority-high';
			case 'urgent': return 'priority-urgent';
			default: return 'priority-medium';
		}
	};

	if (loading) {
		return (
			<div className="complaint-details-container">
				<div className="loading-spinner">
					<div className="spinner"></div>
					<p>Loading complaint details...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="complaint-details-container">
				<div className="error-message">
					<h2>Error</h2>
					<p>{error}</p>
					<Link to="/admin/dashboard" className="btn btn-primary">
						Back to Dashboard
					</Link>
				</div>
			</div>
		);
	}

	if (!complaint) {
		return (
			<div className="complaint-details-container">
				<div className="error-message">
					<h2>Complaint Not Found</h2>
					<p>The requested complaint could not be found.</p>
					<Link to="/admin/dashboard" className="btn btn-primary">
						Back to Dashboard
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="complaint-details-container">
			<div className="details-header">
				<div className="header-navigation">
					<Link 
						to={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'} 
						className="back-btn"
					>
						← Back to Dashboard
					</Link>
					{userRole !== 'admin' && (
						<Link 
							to="/viewComplaints" 
							className="back-btn secondary"
						>
							← View All Complaints
						</Link>
					)}
				</div>
				<h1>Complaint Details</h1>
				<div className="complaint-id">ID: {complaint._id}</div>
			</div>

			{statusUpdateMessage && (
				<div className={`status-message ${statusUpdateMessage.includes('successfully') ? 'success' : 'error'}`}>
					{statusUpdateMessage}
				</div>
			)}

			<div className="details-content">
				<div className="details-grid">
					<div className="details-main">
						<div className="detail-section">
							<h2>Complaint Information</h2>
							<div className="detail-row">
								<label>Title:</label>
								<span className="complaint-title">{complaint.title}</span>
							</div>
							<div className="detail-row">
								<label>Description:</label>
								<div className="complaint-description">
									{complaint.description}
								</div>
							</div>
							<div className="detail-row">
								<label>Department:</label>
								<span>{complaint.department?.name || 'N/A'}</span>
							</div>
							{/* Display building information if it's a building complaint */}
							{complaint.isBuildingComplaint && complaint.building && (
								<div className="detail-row">
									<label>Building:</label>
									<span className="complaint-building">{complaint.building}</span>
								</div>
							)}
						</div>

						{complaint.attachments && complaint.attachments.length > 0 && (
							<div className="detail-section">
								<h2>Attachments</h2>
								<div className="attachments-list">
									{complaint.attachments.map((attachment, index) => (
										<div key={index} className="attachment-item">
											<span className="attachment-icon">📎</span>
											<a 
												href={`http://localhost:4000${attachment.filepath}`}
												target="_blank"
												rel="noopener noreferrer"
												className="attachment-link"
											>
												{attachment.filename}
												{console.log(attachment.filepath)}
											</a>
											<span className="attachment-type">
												({attachment.mimetype})
											</span>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					<div className="details-sidebar">
						<div className="detail-section">
							<h2>Status & Priority</h2>
							<div className="status-priority-grid">
								<div className="status-container">
									<label>Status:</label>
									<span className={`status-badge ${getStatusColor(complaint.status)}`}>
										{complaint.status}
									</span>
									{userRole === 'admin' && (
										<div className="status-update-controls">
											<select 
												value={complaint.status} 
												onChange={(e) => handleStatusUpdate(e.target.value)}
												disabled={updating}
												className="status-select"
											>
												<option value="Open">Open</option>
												<option value="In Progress">In Progress</option>
												<option value="Resolved">Resolved</option>
												<option value="Closed">Closed</option>
											</select>
											{updating && <span className="updating-text">Updating...</span>}
										</div>
										
										
									)}
									
								</div>

								<div className="priority-container">
									<label>Priority:</label>
									<span className={`priority-badge ${getPriorityColor(complaint.priority)}`}>
										{complaint.priority}
									</span>
								</div>
							</div>
						</div>

						

						<div className="detail-section">
							<h2>Dates</h2>
							<div className="detail-row">
								<label>Created:</label>
								<span>{new Date(complaint.createdAt).toLocaleString()}</span>
							</div>
							<div className="detail-row">
								<label>Last Updated:</label>
								<span>{new Date(complaint.updatedAt).toLocaleString()}</span>
							</div>
						</div>

						<div className="detail-section">
							<h2>Submitted By</h2>
							<div className="user-info">
								<div className="user-avatar">
									<span>👤</span>
								</div>
								<div className="user-details">
									<div className="user-name">
										{complaint.user?.username || 'Unknown User'}
									</div>
									<div className="user-email">
										{complaint.user?.email || 'No email available'}
									</div>
								</div>
							</div>
						</div>

						{userRole !== 'admin' && (
							<div className="detail-section">
								<h2>Actions</h2>
								<div className="action-buttons">
									<Link 
										to={`/complaintPage/${complaint._id}`} 
										className="btn btn-primary"
									>
										Edit Complaint
									</Link>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ComplaintDetails;