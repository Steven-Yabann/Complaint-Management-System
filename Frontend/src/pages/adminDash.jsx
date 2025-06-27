// frontend/src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styling/adminDash.css';

const ComplaintsTable = ({ complaints, onStatusUpdate, adminDepartment }) => {
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'open': return 'status-open';
            case 'in progress': case 'in-progress': return 'status-in-progress';
            case 'resolved': case 'closed': return 'status-resolved';
            default: return 'status-open';
        }
    };

    const handleStatusChange = async (complaintId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found. User not authenticated.');
                return;
            }

            const response = await fetch(`http://localhost:4000/api/complaints/${complaintId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                onStatusUpdate(complaintId, newStatus);
                console.log(`Complaint ${complaintId} status updated to ${newStatus}`);
            } else {
                const errorData = await response.json();
                console.error('Failed to update complaint status:', errorData.message || 'Unknown error');
            }
        } catch (error) {
            console.error('Error updating complaint status:', error);
        }
    };

    return (
        <div className="complaints-table-container">
            <div className="complaints-header">
                <h1>Complaints - {adminDepartment} Department</h1>
                <p className="department-subtitle">Managing complaints for the {adminDepartment} department</p>
            </div>
            <div className="complaints-table">
                <div className="table-header">
                    <div className="header-cell">COMPLAINT TITLE</div>
                    <div className="header-cell">COMPLAINT STATUS</div>
                    <div className="header-cell">SUBMITTED BY</div>
                    <div className="header-cell">DATE</div>
                    <div className="header-cell">ACTIONS</div>
                </div>
                {complaints.length === 0 ? (
                    <div className="no-complaints">
                        No complaints to display for {adminDepartment} department
                    </div>
                ) : (
                    complaints.map(complaint => (
                        <div key={complaint._id} className="table-row">
                            <div className="table-cell complaint-title">
                                {complaint.title}
                            </div>
                            <div className="table-cell">
                                <span className={`status-badge ${getStatusColor(complaint.status)}`}>
                                    {complaint.status}
                                </span>
                            </div>
                            <div className="table-cell">
                                {complaint.user?.username || 'Unknown'} 
                            </div>
                            <div className="table-cell">
                                {new Date(complaint.createdAt).toLocaleDateString()}
                            </div>
                            <div className="table-cell actions-cell">
                                <select 
                                    value={complaint.status} 
                                    onChange={(e) => handleStatusChange(complaint._id, e.target.value)}
                                    className="status-select"
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                                <button 
                                    className="view-btn"
                                    onClick={() => {/* Handle view complaint details */}}
                                >
                                    View
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const DashboardOverview = ({ complaints, adminDepartment }) => {
    const total = complaints.length;
    const open = complaints.filter(c => c.status === 'Open').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    const unseenCount = complaints.filter(c => !c.seen).length;

    return (
        <div className="dashboard-overview">
            <h1>Dashboard - {adminDepartment} Department</h1>
            <p className="department-subtitle">Overview of complaints for the {adminDepartment} department</p>
            <div className="overview-stats">
                <div className="stat-card total">
                    <h3>Total Complaints</h3>
                    <span className="stat-number">{total}</span>
                </div>
                <div className="stat-card open">
                    <h3>Open</h3>
                    <span className="stat-number">{open}</span>
                </div>
                <div className="stat-card in-progress">
                    <h3>In Progress</h3>
                    <span className="stat-number">{inProgress}</span>
                </div>
                <div className="stat-card resolved">
                    <h3>Resolved</h3>
                    <span className="stat-number">{resolved}</span>
                </div>
            </div>
            {unseenCount > 0 && (
                <div className="unseen-notification">
                    You have {unseenCount} unseen complaint{unseenCount !== 1 ? 's' : ''} in {adminDepartment}
                </div>
            )}
            {total === 0 && (
                <div className="no-department-complaints">
                    <p>No complaints have been filed for the {adminDepartment} department yet.</p>
                </div>
            )}
        </div>
    );
};

const Analytics = ({ complaints, adminDepartment }) => {
    const getAnalytics = () => {
        const total = complaints.length;
        const thisMonth = complaints.filter(c => {
            const complaintDate = new Date(c.createdAt);
            const now = new Date();
            return complaintDate.getMonth() === now.getMonth() && 
                   complaintDate.getFullYear() === now.getFullYear();
        }).length;

        const avgResolutionTime = "5.2 days"; 
        const satisfactionRate = "87%"; 

        return { total, thisMonth, avgResolutionTime, satisfactionRate };
    };

    const analytics = getAnalytics();

    return (
        <div className="analytics-container">
            <h1>Analytics - {adminDepartment} Department</h1>
            <p className="department-subtitle">Performance metrics for the {adminDepartment} department</p>
            <div className="analytics-grid">
                <div className="analytics-card">
                    <h3>Total Complaints</h3>
                    <span className="analytics-number">{analytics.total}</span>
                </div>
                <div className="analytics-card">
                    <h3>This Month</h3>
                    <span className="analytics-number">{analytics.thisMonth}</span>
                </div>
                <div className="analytics-card">
                    <h3>Avg Resolution Time</h3>
                    <span className="analytics-number">{analytics.avgResolutionTime}</span>
                </div>
                <div className="analytics-card">
                    <h3>Satisfaction Rate</h3>
                    <span className="analytics-number">{analytics.satisfactionRate}</span>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [complaints, setComplaints] = useState([]);
    const [filteredComplaints, setFilteredComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adminName, setAdminName] = useState('Admin');
    const [adminDepartment, setAdminDepartment] = useState('');
    const [showProfileDropdown, setShowProfileDropdown] = useState(false);

    const currentView = location.pathname.split('/').pop() || 'dashboard';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const handleStatusUpdate = (complaintId, newStatus) => {
        const updatedComplaints = complaints.map(complaint =>
            complaint._id === complaintId
                ? { ...complaint, status: newStatus }
                : complaint
        );
        setComplaints(updatedComplaints);
        filterComplaints(currentView, updatedComplaints); 
    };

    const filterComplaints = (view, complaintsArray = complaints) => {
        switch (view) {
            case 'new':
                setFilteredComplaints(complaintsArray.filter(c => c.status === 'Open'));
                break;
            case 'in-progress':
                setFilteredComplaints(complaintsArray.filter(c => c.status === 'In Progress'));
                break;
            case 'resolved':
                setFilteredComplaints(complaintsArray.filter(c => 
                    c.status === 'Resolved' || c.status === 'Closed'
                ));
                break;
            default:
                setFilteredComplaints(complaintsArray);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        const fetchAdminProfile = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/admin/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setAdminName(data.username || 'Admin');
                    setAdminDepartment(data.department || 'Unknown');
                    console.log(`Admin ${data.username} logged in for department: ${data.department}`);
                } else {
                    console.error('Failed to fetch admin profile:', await response.json());
                }
            } catch (err) {
                console.error('Error fetching admin profile:', err);
            }
        };

        const fetchAllComplaints = async () => {
            try {
                const response = await fetch('http://localhost:4000/api/complaints/admin/all', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setComplaints(data.data || data);
                    filterComplaints(currentView, data.data || data); 
                    console.log(`Loaded ${data.count || 0} complaints for ${data.adminDepartment || 'unknown'} department`);
                    
                    // Set department name from API response if we have it
                    if (data.adminDepartment) {
                        setAdminDepartment(data.adminDepartment);
                    }
                } else {
                    const errorData = await response.json();
                    setError(errorData.message || 'Failed to fetch complaints.');
                    console.error('Failed to fetch complaints:', errorData);
                }
            } catch (err) {
                setError('Network error: Could not connect to the server.');
                console.error('Network error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminProfile();
        fetchAllComplaints();
    }, [navigate]); 

    useEffect(() => {
        filterComplaints(currentView);
    }, [currentView, complaints]); 

    const renderMainContent = () => {
        if (loading) return <div className="loading">Loading dashboard...</div>;
        if (error) return <div className="error">Error: {error}</div>;

        switch (currentView) {
            case 'dashboard':
                return <DashboardOverview complaints={complaints} adminDepartment={adminDepartment} />;
            case 'analytics':
                return <Analytics complaints={complaints} adminDepartment={adminDepartment} />;
            case 'new':
            case 'in-progress':
            case 'resolved':
                return <ComplaintsTable complaints={filteredComplaints} onStatusUpdate={handleStatusUpdate} adminDepartment={adminDepartment} />;
            default:
                return <ComplaintsTable complaints={complaints} onStatusUpdate={handleStatusUpdate} adminDepartment={adminDepartment} />;
        }
    };

    return (
        <div className="admin-dashboard-container">
            <nav className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="bics-logo">{adminDepartment || 'ADMIN'}</div>
                </div>
                <ul className="admin-sidebar-links">
                    <li>
                        <Link 
                            to="/admin/dashboard" 
                            className={currentView === 'dashboard' ? 'active' : ''}
                        >
                            <span className="nav-icon">⊚</span>
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/new" 
                            className={currentView === 'new' ? 'active' : ''}
                        >
                            <span className="nav-icon">📋</span>
                            New Complaints
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/in-progress" 
                            className={currentView === 'in-progress' ? 'active' : ''}
                        >
                            <span className="nav-icon">🕐</span>
                            In-Progress
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/resolved" 
                            className={currentView === 'resolved' ? 'active' : ''}
                        >
                            <span className="nav-icon">✓</span>
                            Resolved
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/analytics" 
                            className={currentView === 'analytics' ? 'active' : ''}
                        >
                            <span className="nav-icon">📊</span>
                            Analytics
                        </Link>
                    </li>
                </ul>
            </nav>

            <main className="admin-main-content">
                <header className="admin-header">
                    <div className="header-title">{adminDepartment} COMPLAINT MANAGEMENT</div>
                    <div className="admin-profile" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
                        <div className="admin-info">
                            <span className="admin-name">{adminName}</span>
                            <span className="admin-role">{adminDepartment} Department Admin</span>
                        </div>
                        <span className="dropdown-arrow">▼</span>
                        
                        {showProfileDropdown && (
                            <div className="profile-dropdown">
                                <Link to="/admin/profile" className="dropdown-item">Profile</Link>
                                <button onClick={handleLogout} className="dropdown-item logout">Logout</button>
                            </div>
                        )}
                    </div>
                </header>

                <section className="admin-content">
                    {renderMainContent()}
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;