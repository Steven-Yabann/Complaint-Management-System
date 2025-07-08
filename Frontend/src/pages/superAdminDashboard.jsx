import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import '../styling/superAdminDash.css';

const SuperAdminDashboard = () => {
	const [currentView, setCurrentView] = useState('dashboard');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [stats, setStats] = useState({});
	const [users, setUsers] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [complaints, setComplaints] = useState([]);
	const [feedbackData, setFeedbackData] = useState([]);
	const [selectedDepartment, setSelectedDepartment] = useState('all');
	const [showModal, setShowModal] = useState(false);
	const [modalType, setModalType] = useState('');
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [userRole, setUserRole] = useState('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	
	const navigate = useNavigate();
	const location = useLocation();

	useEffect(() => {
		const pathParts = location.pathname.split('/');
		const view = pathParts[pathParts.length - 1];
		setCurrentView(view === 'super-admin' ? 'dashboard' : view);
	}, [location]);

	useEffect(() => {
		fetchData();
	}, [currentView, currentPage, userRole, searchTerm]);

	const fetchData = async () => {
		setLoading(true);
		setError('');
		try {
			if (currentView === 'dashboard') {
				await Promise.all([fetchStats(), fetchComplaints(), fetchFeedbackData()]);
			} else if (currentView === 'users') {
				await fetchUsers();
			}
			
			if (currentView === 'departments' || currentView === 'dashboard') {
				await fetchDepartments();
			}
		} catch (err) {
			setError('Failed to fetch data');
			console.error('Error fetching data:', err);
		} finally {
			setLoading(false);
		}
	};

	const fetchStats = async () => {
		const token = localStorage.getItem('token');
		const response = await fetch('http://localhost:4000/api/super-admin/stats', {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		if (response.ok) {
			const data = await response.json();
			setStats(data.data);
		}
	};

	const fetchComplaints = async () => {
		const token = localStorage.getItem('token');
		const response = await fetch('http://localhost:4000/api/super-admin/complaints', {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		if (response.ok) {
			const data = await response.json();
			setComplaints(data.data || []);
		}
	};

	const fetchFeedbackData = async () => {
		const token = localStorage.getItem('token');
		const response = await fetch('http://localhost:4000/api/super-admin/feedback-analytics', {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		if (response.ok) {
			const data = await response.json();
			setFeedbackData(data.data || []);
		}
	};

	const fetchUsers = async () => {
		const token = localStorage.getItem('token');
		const queryParams = new URLSearchParams({
			page: currentPage,
			limit: 20,
			...(userRole !== 'all' && { role: userRole }),
			...(searchTerm && { search: searchTerm })
		});
		
		const response = await fetch(`http://localhost:4000/api/super-admin/users?${queryParams}`, {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		if (response.ok) {
			const data = await response.json();
			setUsers(data.data);
			setTotalPages(data.pages);
		}
	};

	const fetchDepartments = async () => {
		const token = localStorage.getItem('token');
		const response = await fetch('http://localhost:4000/api/super-admin/departments', {
			headers: { 'Authorization': `Bearer ${token}` }
		});
		if (response.ok) {
			const data = await response.json();
			setDepartments(data.data);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('username');
		localStorage.removeItem('role');
		navigate('/login');
	};

	const openModal = (type, item = null) => {
		setModalType(type);
		setSelectedItem(item);
		setShowModal(true);
	};

	const closeModal = () => {
		setShowModal(false);
		setModalType('');
		setSelectedItem(null);
	};

	const handleFormSubmit = async (formData) => {
		const token = localStorage.getItem('token');
		try {
			let url, method;
			
			if (modalType === 'createAdmin') {
				url = 'http://localhost:4000/api/super-admin/create-admin';
				method = 'POST';
			} else if (modalType === 'editUser') {
				url = `http://localhost:4000/api/super-admin/users/${selectedItem._id}`;
				method = 'PUT';
			} else if (modalType === 'createDepartment') {
				url = 'http://localhost:4000/api/super-admin/departments';
				method = 'POST';
			} else if (modalType === 'editDepartment') {
				url = `http://localhost:4000/api/super-admin/departments/${selectedItem._id}`;
				method = 'PUT';
			}

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				body: JSON.stringify(formData)
			});

			if (response.ok) {
				closeModal();
				await fetchData();
			} else {
				const errorData = await response.json();
				alert(errorData.message || 'Error processing request');
			}
		} catch (err) {
			console.error('Error submitting form:', err);
			alert('Error processing request');
		}
	};

	const handleDelete = async (type, id) => {
		if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
		
		const token = localStorage.getItem('token');
		const url = type === 'user' 
			? `http://localhost:4000/api/super-admin/users/${id}`
			: `http://localhost:4000/api/super-admin/departments/${id}`;
		
		try {
			const response = await fetch(url, {
				method: 'DELETE',
				headers: { 'Authorization': `Bearer ${token}` }
			});

			if (response.ok) {
				await fetchData();
			} else {
				const errorData = await response.json();
				alert(errorData.message || 'Error deleting item');
			}
		} catch (err) {
			console.error('Error deleting item:', err);
			alert('Error deleting item');
		}
	};

	// Analytics calculation function
	const getAnalytics = () => {
		let filteredComplaints = complaints;
		
		if (selectedDepartment !== 'all') {
			filteredComplaints = complaints.filter(c => c.department?._id === selectedDepartment);
		}

		if (!filteredComplaints.length) {
			return {
				total: 0,
				thisMonth: 0,
				avgResolutionTime: 0,
				satisfactionRate: 0,
				monthlyTrends: [],
				statusDistribution: [],
				departmentBreakdown: [],
				priorityDistribution: [],
				recentActivity: [],
				resolutionStats: {},
				feedbackStats: {}
			};
		}

		const total = filteredComplaints.length;
		const now = new Date();

		// This month complaints
		const thisMonth = filteredComplaints.filter(c => {
			const complaintDate = new Date(c.createdAt);
			return complaintDate.getMonth() === now.getMonth() && 
				   complaintDate.getFullYear() === now.getFullYear();
		}).length;

		// Monthly trends (last 6 months)
		const monthlyTrends = [];
		for (let i = 5; i >= 0; i--) {
			const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
			const count = filteredComplaints.filter(c => {
				const complaintDate = new Date(c.createdAt);
				return complaintDate.getMonth() === targetDate.getMonth() && 
					   complaintDate.getFullYear() === targetDate.getFullYear();
			}).length;
			monthlyTrends.push({ month: monthName, complaints: count });
		}

		// Status distribution
		const statusCount = {};
		filteredComplaints.forEach(c => {
			statusCount[c.status] = (statusCount[c.status] || 0) + 1;
		});
		const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({
			status,
			count,
			percentage: ((count / total) * 100).toFixed(1)
		}));

		// Department breakdown
		const deptCount = {};
		filteredComplaints.forEach(c => {
			const deptName = c.department?.name || 'Unknown';
			deptCount[deptName] = (deptCount[deptName] || 0) + 1;
		});
		const departmentBreakdown = Object.entries(deptCount).map(([department, count]) => ({
			department,
			count,
			percentage: ((count / total) * 100).toFixed(1)
		}));

		// Priority distribution
		const priorityCount = {};
		filteredComplaints.forEach(c => {
			priorityCount[c.priority] = (priorityCount[c.priority] || 0) + 1;
		});
		const priorityDistribution = Object.entries(priorityCount).map(([priority, count]) => ({
			priority,
			count
		}));

		// Calculate average resolution time
		const resolvedComplaints = filteredComplaints.filter(c => 
			c.status === 'Resolved' || c.status === 'Closed'
		);
		let avgResolutionTime = 0;
		if (resolvedComplaints.length > 0) {
			const totalResolutionTime = resolvedComplaints.reduce((acc, c) => {
				const created = new Date(c.createdAt);
				const updated = new Date(c.updatedAt);
				const diffTime = Math.abs(updated - created);
				const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
				return acc + diffDays;
			}, 0);
			avgResolutionTime = (totalResolutionTime / resolvedComplaints.length).toFixed(1);
		}

		// Feedback statistics
		const feedbackStats = {
			totalFeedback: feedbackData.length,
			averageRating: feedbackData.length > 0 ? 
				(feedbackData.reduce((acc, f) => acc + f.rating, 0) / feedbackData.length).toFixed(1) : 0,
			satisfactionRate: feedbackData.length > 0 ? 
				((feedbackData.filter(f => f.rating >= 4).length / feedbackData.length) * 100).toFixed(1) : 0
		};

		// Recent activity
		const recentActivity = filteredComplaints
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
			.slice(0, 10)
			.map(c => ({
				id: c._id,
				title: c.title,
				status: c.status,
				department: c.department?.name || 'Unknown',
				date: new Date(c.createdAt).toLocaleDateString(),
				user: c.user?.username || 'Unknown'
			}));

		return {
			total,
			thisMonth,
			avgResolutionTime,
			satisfactionRate: feedbackStats.satisfactionRate,
			monthlyTrends,
			statusDistribution,
			departmentBreakdown,
			priorityDistribution,
			recentActivity,
			resolutionStats: {
				resolved: resolvedComplaints.length,
				pending: filteredComplaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length,
				avgResolutionTime
			},
			feedbackStats
		};
	};

	// Download PDF function
	const downloadPDF = async () => {
		setLoading(true);
		try {
			const analytics = getAnalytics();
			const date = new Date().toLocaleDateString();
			const departmentName = selectedDepartment === 'all' ? 'All Departments' : 
				departments.find(d => d._id === selectedDepartment)?.name || 'Unknown';
			
			// Create HTML content for PDF
			const htmlContent = `
				<!DOCTYPE html>
				<html>
				<head>
					<title>Complaint Analytics Report</title>
					<style>
						body { font-family: Arial, sans-serif; margin: 20px; }
						.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
						.summary { display: flex; justify-content: space-around; margin: 20px 0; }
						.summary-item { text-align: center; }
						.summary-number { font-size: 24px; font-weight: bold; color: #2c3e50; }
						.section { margin: 30px 0; }
						.section h2 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }
						table { width: 100%; border-collapse: collapse; margin: 10px 0; }
						th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
						th { background-color: #f2f2f2; }
						.footer { margin-top: 50px; text-align: center; color: #666; }
					</style>
				</head>
				<body>
					<div class="header">
						<h1>Complaint Management System - Analytics Report</h1>
						<p>Generated on: ${date}</p>
						<p>Department: ${departmentName}</p>
					</div>
					
					<div class="summary">
						<div class="summary-item">
							<div class="summary-number">${analytics.total}</div>
							<div>Total Complaints</div>
						</div>
						<div class="summary-item">
							<div class="summary-number">${analytics.thisMonth}</div>
							<div>This Month</div>
						</div>
						<div class="summary-item">
							<div class="summary-number">${analytics.avgResolutionTime}</div>
							<div>Avg Resolution (Days)</div>
						</div>
						<div class="summary-item">
							<div class="summary-number">${analytics.satisfactionRate}%</div>
							<div>Satisfaction Rate</div>
						</div>
					</div>

					<div class="section">
						<h2>Status Distribution</h2>
						<table>
							<thead>
								<tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
							</thead>
							<tbody>
								${analytics.statusDistribution.map(s => 
									`<tr><td>${s.status}</td><td>${s.count}</td><td>${s.percentage}%</td></tr>`
								).join('')}
							</tbody>
						</table>
					</div>

					<div class="section">
						<h2>Department Breakdown</h2>
						<table>
							<thead>
								<tr><th>Department</th><th>Count</th><th>Percentage</th></tr>
							</thead>
							<tbody>
								${analytics.departmentBreakdown.map(d => 
									`<tr><td>${d.department}</td><td>${d.count}</td><td>${d.percentage}%</td></tr>`
								).join('')}
							</tbody>
						</table>
					</div>

					<div class="section">
						<h2>Monthly Trends</h2>
						<table>
							<thead>
								<tr><th>Month</th><th>Complaints</th></tr>
							</thead>
							<tbody>
								${analytics.monthlyTrends.map(m => 
									`<tr><td>${m.month}</td><td>${m.complaints}</td></tr>`
								).join('')}
							</tbody>
						</table>
					</div>

					<div class="section">
						<h2>Recent Activity</h2>
						<table>
							<thead>
								<tr><th>Title</th><th>Status</th><th>Department</th><th>Date</th><th>User</th></tr>
							</thead>
							<tbody>
								${analytics.recentActivity.map(a => 
									`<tr><td>${a.title}</td><td>${a.status}</td><td>${a.department}</td><td>${a.date}</td><td>${a.user}</td></tr>`
								).join('')}
							</tbody>
						</table>
					</div>

					<div class="footer">
						<p>This report was generated automatically by the Complaint Management System.</p>
					</div>
				</body>
				</html>
			`;

			// Create and download PDF
			const printWindow = window.open('', '_blank');
			printWindow.document.write(htmlContent);
			printWindow.document.close();
			printWindow.print();

		} catch (error) {
			console.error('Error generating PDF:', error);
			alert('Error generating PDF report');
		} finally {
			setLoading(false);
		}
	};

	const renderDashboard = () => {
		const analytics = getAnalytics();
		const COLORS = ['#e74c3c', '#f39c12', '#27ae60', '#3498db', '#9b59b6', '#1abc9c'];

		return (
			<div className="dashboard-overview">
				<div className="dashboard-header">
					<h1>Super Admin Dashboard</h1>
					<div className="dashboard-controls">
						<select 
							value={selectedDepartment} 
							onChange={(e) => setSelectedDepartment(e.target.value)}
							className="department-filter"
						>
							<option value="all">All Departments</option>
							{departments.map(dept => (
								<option key={dept._id} value={dept._id}>{dept.name}</option>
							))}
						</select>
						<button 
							onClick={downloadPDF} 
							className="btn btn-primary"
							disabled={loading}
						>
							{loading ? 'Generating PDF...' : 'Download PDF Report'}
						</button>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="stats-grid">
					<div className="stat-card">
						<h3>Total Complaints</h3>
						<span className="stat-number">{analytics.total}</span>
					</div>
					<div className="stat-card">
						<h3>This Month</h3>
						<span className="stat-number">{analytics.thisMonth}</span>
					</div>
					<div className="stat-card">
						<h3>Avg Resolution</h3>
						<span className="stat-number">{analytics.avgResolutionTime} days</span>
					</div>
					<div className="stat-card">
						<h3>Satisfaction Rate</h3>
						<span className="stat-number">{analytics.satisfactionRate}%</span>
					</div>
				</div>

				{/* Charts Section */}
				<div className="charts-section">
					{/* Monthly Trends */}
					<div className="chart-container">
						<h3>Monthly Trends (Last 6 Months)</h3>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={analytics.monthlyTrends}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Line type="monotone" dataKey="complaints" stroke="#3498db" strokeWidth={2} />
							</LineChart>
						</ResponsiveContainer>
					</div>

					{/* Status Distribution */}
					<div className="chart-container">
						<h3>Status Distribution</h3>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={analytics.statusDistribution}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ status, percentage }) => `${status}: ${percentage}%`}
									outerRadius={80}
									fill="#8884d8"
									dataKey="count"
								>
									{analytics.statusDistribution.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
									))}
								</Pie>
								<Tooltip />
							</PieChart>
						</ResponsiveContainer>
					</div>

					{/* Department Breakdown */}
					<div className="chart-container">
						<h3>Department Breakdown</h3>
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={analytics.departmentBreakdown}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="department" />
								<YAxis />
								<Tooltip />
								<Bar dataKey="count" fill="#27ae60" />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</div>

				{/* Recent Activity */}
				<div className="recent-activity-section">
					<h3>Recent Activity</h3>
					<div className="activity-table">
						<table>
							<thead>
								<tr>
									<th>Title</th>
									<th>Status</th>
									<th>Department</th>
									<th>Date</th>
									<th>User</th>
								</tr>
							</thead>
							<tbody>
								{analytics.recentActivity.map(activity => (
									<tr key={activity.id}>
										<td>{activity.title}</td>
										<td><span className={`status-badge ${activity.status.toLowerCase()}`}>{activity.status}</span></td>
										<td>{activity.department}</td>
										<td>{activity.date}</td>
										<td>{activity.user}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		);
	};

	const renderUsers = () => (
		<div className="users-management">
			<div className="section-header">
				<h1>User Management</h1>
				<button 
					className="btn btn-primary"
					onClick={() => openModal('createAdmin')}
				>
					Create Admin
				</button>
			</div>
			
			<div className="filters">
				<input
					type="text"
					placeholder="Search users..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="search-input"
				/>
				<select 
					value={userRole} 
					onChange={(e) => setUserRole(e.target.value)}
					className="role-filter"
				>
					<option value="all">All Roles</option>
					<option value="user">Users</option>
					<option value="admin">Admins</option>
				</select>
			</div>

			<div className="users-table">
				<table>
					<thead>
						<tr>
							<th>Username</th>
							<th>Email</th>
							<th>Role</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{users.map(user => (
							<tr key={user._id}>
								<td>{user.username}</td>
								<td>{user.email}</td>
								<td>
									<span className={`role-badge ${user.role}`}>
										{user.role}
									</span>
								</td>
								<td>
									<button 
										onClick={() => openModal('editUser', user)}
										className="btn btn-sm btn-secondary"
									>
										Edit
									</button>
									<button 
										onClick={() => handleDelete('user', user._id)}
										className="btn btn-sm btn-danger"
									>
										Delete
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{totalPages > 1 && (
				<div className="pagination">
					{Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
						<button
							key={page}
							onClick={() => setCurrentPage(page)}
							className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
						>
							{page}
						</button>
					))}
				</div>
			)}
		</div>
	);

	const renderDepartments = () => (
		<div className="departments-management">
			<div className="section-header">
				<h1>Department Management</h1>
				<button 
					className="btn btn-primary"
					onClick={() => openModal('createDepartment')}
				>
					Create Department
				</button>
			</div>

			<div className="departments-grid">
				{departments.map(dept => (
					<div key={dept._id} className="department-card">
						<h3>{dept.name}</h3>
						<p>{dept.description || 'No description'}</p>
						<div className="department-stats">
							<span className="stat">Complaints: {dept.complaintCount}</span>
							<span className="stat">Admins: {dept.adminCount}</span>
						</div>
						<div className="department-actions">
							<button 
								onClick={() => openModal('editDepartment', dept)}
								className="btn btn-sm btn-secondary"
							>
								Edit
							</button>
							<button 
								onClick={() => handleDelete('department', dept._id)}
								className="btn btn-sm btn-danger"
							>
								Delete
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);

	const renderModal = () => {
		if (!showModal) return null;

		return (
			<div className="modal-overlay">
				<div className="modal-content">
					<h3>
						{modalType === 'createAdmin' && 'Create Admin User'}
						{modalType === 'createDepartment' && 'Create Department'}
						{modalType === 'editUser' && 'Edit User'}
						{modalType === 'editDepartment' && 'Edit Department'}
					</h3>
					
					<ModalForm 
						type={modalType}
						item={selectedItem}
						departments={departments}
						onSubmit={handleFormSubmit}
						onCancel={closeModal}
					/>
				</div>
			</div>
		);
	};

	const renderMainContent = () => {
		if (loading) return <div className="loading">Loading...</div>;
		if (error) return <div className="error">{error}</div>;

		switch (currentView) {
			case 'users':
				return renderUsers();
			case 'departments':
				return renderDepartments();
			default:
				return renderDashboard();
		}
	};

	// Updated ModalForm Component in superAdminDashboard.jsx
	const ModalForm = ({ type, item, departments, onSubmit, onCancel }) => {
		const [formData, setFormData] = useState({
			username: item?.username || '',
			email: item?.email || '',
			password: '',
			role: item?.role || 'user',
			department: item?.department?._id || '',
			name: item?.name || '',
			description: item?.description || ''
		});

		const handleSubmit = (e) => {
			e.preventDefault();
			
			// Create submission data based on form type
			let submitData = {};
			
			if (type === 'createAdmin') {
				submitData = {
					username: formData.username,
					email: formData.email,
					password: formData.password,
					department: formData.department || null // Include department assignment
				};
			} else if (type === 'editUser') {
				submitData = {
					username: formData.username,
					email: formData.email,
					role: formData.role,
					department: formData.department || null // Allow department updates
				};
			} else if (type === 'createDepartment' || type === 'editDepartment') {
				submitData = {
					name: formData.name,
					description: formData.description
				};
			}

			onSubmit(submitData);
		};

		const handleChange = (e) => {
			const { name, value } = e.target;
			setFormData(prev => ({
				...prev,
				[name]: value
			}));
		};

		return (
			<form onSubmit={handleSubmit} className="modal-form">
				{(type === 'createAdmin' || type === 'editUser') && (
					<>
						<div className="form-group">
							<label>Username</label>
							<input
								type="text"
								name="username"
								value={formData.username}
								onChange={handleChange}
								required
							/>
						</div>
						
						<div className="form-group">
							<label>Email</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								required
							/>
						</div>

						{type === 'createAdmin' && (
							<>
								<div className="form-group">
									<label>Password</label>
									<input
										type="password"
										name="password"
										value={formData.password}
										onChange={handleChange}
										required
										minLength="6"
									/>
								</div>
								
								<div className="form-group">
									<label>Department</label>
									<select
										name="department"
										value={formData.department}
										onChange={handleChange}
									>
										<option value="">Select Department (Optional)</option>
										{departments.map(dept => (
											<option key={dept._id} value={dept._id}>
												{dept.name}
											</option>
										))}
									</select>
									<small className="form-help">
										Assign this admin to a specific department. Leave blank if admin should have access to all departments.
									</small>
								</div>
							</>
						)}

						{type === 'editUser' && (
							<>
								<div className="form-group">
									<label>Role</label>
									<select
										name="role"
										value={formData.role}
										onChange={handleChange}
									>
										<option value="user">User</option>
										<option value="admin">Admin</option>
									</select>
								</div>
								
								{formData.role === 'admin' && (
									<div className="form-group">
										<label>Department</label>
										<select
											name="department"
											value={formData.department}
											onChange={handleChange}
										>
											<option value="">No Department</option>
											{departments.map(dept => (
												<option key={dept._id} value={dept._id}>
													{dept.name}
												</option>
											))}
										</select>
										<small className="form-help">
											Select the department this admin should manage.
										</small>
									</div>
								)}
							</>
						)}
					</>
				)}

				{(type === 'createDepartment' || type === 'editDepartment') && (
					<>
						<div className="form-group">
							<label>Department Name</label>
							<input
								type="text"
								name="name"
								value={formData.name}
								onChange={handleChange}
								required
							/>
						</div>
						
						<div className="form-group">
							<label>Description</label>
							<textarea
								name="description"
								value={formData.description}
								onChange={handleChange}
								rows="4"
							/>
						</div>
					</>
				)}

				<div className="modal-actions">
					<button type="button" onClick={onCancel} className="btn btn-secondary">
						Cancel
					</button>
					<button type="submit" className="btn btn-primary">
						{type.includes('create') ? 'Create' : 'Update'}
					</button>
				</div>
			</form>
		);
	};

	return (
		<div className="super-admin-container">
			<nav className="super-admin-sidebar">
				<div className="sidebar-header">
					<h2>Super Admin</h2>
				</div>
				<ul className="sidebar-links">
					<li>
						<Link 
							to="/super-admin/dashboard" 
							className={currentView === 'dashboard' || currentView === 'super-admin' ? 'active' : ''}
						>
							Dashboard
						</Link>
					</li>
					<li>
						<Link 
							to="/super-admin/users" 
							className={currentView === 'users' ? 'active' : ''}
						>
							User Management
						</Link>
					</li>
					<li>
						<Link 
							to="/super-admin/departments" 
							className={currentView === 'departments' ? 'active' : ''}
						>
							Departments
						</Link>
					</li>
					<li>
						<button onClick={handleLogout} className="logout-btn">
							Logout
						</button>
					</li>
				</ul>
			</nav>

			<main className="super-admin-main">
				{renderMainContent()}
			</main>

			{renderModal()}
		</div>
	);
};



export default SuperAdminDashboard;