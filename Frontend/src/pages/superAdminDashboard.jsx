// Frontend/src/pages/SuperAdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styling/superAdminDash.css';

const SuperAdminDashboard = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [stats, setStats] = useState(null);
	const [users, setUsers] = useState([]);
	const [departments, setDepartments] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [showModal, setShowModal] = useState(false);
	const [modalType, setModalType] = useState(''); // 'createAdmin', 'createDepartment', 'editUser', 'editDepartment'
	const [selectedItem, setSelectedItem] = useState(null);
	const [searchTerm, setSearchTerm] = useState('');
	const [userRole, setUserRole] = useState('all');
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	const currentView = location.pathname.split('/').pop() || 'dashboard';

	useEffect(() => {
		const token = localStorage.getItem('token');
		if (!token) {
			navigate('/login');
			return;
		}

		fetchData();
	}, [navigate, currentView, currentPage, searchTerm, userRole]);

	const fetchData = async () => {
		setLoading(true);
		try {
			const token = localStorage.getItem('token');
			
			if (currentView === 'dashboard' || currentView === 'super-admin') {
				await fetchStats();
			}
			
			if (currentView === 'users' || currentView === 'dashboard') {
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
		localStorage.removeItem('userRole');
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
		let url, method;
		
		switch (modalType) {
			case 'createAdmin':
				url = 'http://localhost:4000/api/super-admin/create-admin';
				method = 'POST';
				break;
			case 'createDepartment':
				url = 'http://localhost:4000/api/super-admin/departments';
				method = 'POST';
				break;
			case 'editUser':
				url = `http://localhost:4000/api/super-admin/users/${selectedItem._id}`;
				method = 'PUT';
				break;
			case 'editDepartment':
				url = `http://localhost:4000/api/super-admin/departments/${selectedItem._id}`;
				method = 'PUT';
				break;
			default:
				return;
		}

		try {
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
				fetchData();
			} else {
				const errorData = await response.json();
				alert(errorData.message || 'An error occurred');
			}
		} catch (err) {
			console.error('Error submitting form:', err);
			alert('Network error occurred');
		}
	};

	const handleDelete = async (type, id) => {
		if (!confirm('Are you sure you want to delete this item?')) return;

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
				fetchData();
			} else {
				const errorData = await response.json();
				alert(errorData.message || 'Failed to delete');
			}
		} catch (err) {
			console.error('Error deleting:', err);
			alert('Network error occurred');
		}
	};

	const renderDashboard = () => (
		<div className="dashboard-overview">
			<h1>Super Admin Dashboard</h1>
			
			{stats && (
				<>
					<div className="stats-grid">
						<div className="stat-card">
							<h3>Total Users</h3>
							<span className="stat-number">{stats.overview.totalUsers}</span>
						</div>
						<div className="stat-card">
							<h3>Total Admins</h3>
							<span className="stat-number">{stats.overview.totalAdmins}</span>
						</div>
						<div className="stat-card">
							<h3>Departments</h3>
							<span className="stat-number">{stats.overview.totalDepartments}</span>
						</div>
						<div className="stat-card">
							<h3>Total Complaints</h3>
							<span className="stat-number">{stats.overview.totalComplaints}</span>
						</div>
					</div>

					<div className="recent-activity">
						<div className="recent-section">
							<h3>Recent Users</h3>
							<div className="recent-list">
								{stats.recentUsers.slice(0, 5).map(user => (
									<div key={user._id} className="recent-item">
										<span className="recent-title">{user.username}</span>
										<span className="recent-meta">{user.role} - {user.department?.name || 'No Department'}</span>
									</div>
								))}
							</div>
						</div>
						
						<div className="recent-section">
							<h3>Recent Complaints</h3>
							<div className="recent-list">
								{stats.recentComplaints.slice(0, 5).map(complaint => (
									<div key={complaint._id} className="recent-item">
										<span className="recent-title">{complaint.title}</span>
										<span className="recent-meta">{complaint.user?.username} - {complaint.department?.name}</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);

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
							<th>Department</th>
							<th>Verified</th>
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
								<td>{user.department?.name || 'None'}</td>
								<td>
									<span className={`status-badge ${user.isVerified ? 'verified' : 'unverified'}`}>
										{user.isVerified ? 'Yes' : 'No'}
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

// Modal Form Component
const ModalForm = ({ type, item, departments, onSubmit, onCancel }) => {
	const [formData, setFormData] = useState({
		username: item?.username || '',
		email: item?.email || '',
		password: '',
		role: item?.role || 'user',
		department: item?.department?._id || '',
		isVerified: item?.isVerified || false,
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
				department: formData.department || null
			};
		} else if (type === 'editUser') {
			submitData = {
				username: formData.username,
				email: formData.email,
				role: formData.role,
				department: formData.department || null,
				isVerified: formData.isVerified
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
		const { name, value, type: inputType, checked } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: inputType === 'checkbox' ? checked : value
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
					)}

					{type === 'editUser' && (
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
					)}

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
					</div>

					{type === 'editUser' && (
						<div className="form-group">
							<label>
								<input
									type="checkbox"
									name="isVerified"
									checked={formData.isVerified}
									onChange={handleChange}
								/>
								Email Verified
							</label>
						</div>
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

export default SuperAdminDashboard;