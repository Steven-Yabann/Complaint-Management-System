// frontend/src/pages/AdminDashboard.jsx

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styling/adminDash.css';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';

const ComplaintsTable = ({ complaints, onStatusUpdate, adminDepartment, searchTerm, onSearchChange }) => {
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'open': return 'status-open';
            case 'in progress': case 'in-progress': return 'status-in-progress';
            case 'resolved': case 'closed': return 'status-resolved';
            default: return 'status-open';
        }
    };

    // Filter complaints based on search term
    const filteredComplaints = complaints.filter(complaint =>
        complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.user?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        complaint.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                
                {/* Search/Filter Section */}
                <div className="complaints-search-section">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="Search by title, submitter, or description..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="search-input"
                        />
                        <span className="search-icon">🔍</span>
                    </div>
                    <div className="search-results-info">
                        {searchTerm && (
                            <span className="search-results-text">
                                Showing {filteredComplaints.length} of {complaints.length} complaints
                                {searchTerm && ` for "${searchTerm}"`}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="complaints-table">
                <div className="table-header">
                    <div className="header-cell">COMPLAINT TITLE</div>
                    <div className="header-cell">COMPLAINT STATUS</div>
                    <div className="header-cell">SUBMITTED BY</div>
                    <div className="header-cell">DATE</div>
                    <div className="header-cell">ACTIONS</div>
                </div>
                {filteredComplaints.length === 0 ? (
                    <div className="no-complaints">
                        {searchTerm ? (
                            <>
                                No complaints found matching "{searchTerm}" in {adminDepartment} department
                                <br />
                                <button 
                                    onClick={() => onSearchChange('')}
                                    className="clear-search-btn"
                                >
                                    Clear Search
                                </button>
                            </>
                        ) : (
                            `No complaints to display for ${adminDepartment} department`
                        )}
                    </div>
                ) : (
                    filteredComplaints.map(complaint => (
                        <div key={complaint._id} className="table-row">
                            <div className="table-cell complaint-title">
                                {/* Highlight search term in title */}
                                {searchTerm ? (
                                    <span dangerouslySetInnerHTML={{
                                        __html: complaint.title.replace(
                                            new RegExp(`(${searchTerm})`, 'gi'),
                                            '<mark>$1</mark>'
                                        )
                                    }} />
                                ) : (
                                    complaint.title
                                )}
                            </div>
                            <div className="table-cell">
                                <span className={`status-badge ${getStatusColor(complaint.status)}`}>
                                    {complaint.status}
                                </span>
                            </div>
                            <div className="table-cell">
                                {/* Highlight search term in username */}
                                {searchTerm && complaint.user?.username ? (
                                    <span dangerouslySetInnerHTML={{
                                        __html: complaint.user.username.replace(
                                            new RegExp(`(${searchTerm})`, 'gi'),
                                            '<mark>$1</mark>'
                                        )
                                    }} />
                                ) : (
                                    complaint.user?.username || 'Unknown'
                                )}
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


const Analytics = ({ complaints }) => {
    const [feedbackData, setFeedbackData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch feedback data for analytics
    useEffect(() => {
        const fetchFeedbackData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch('http://localhost:4000/api/feedback/analytics', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setFeedbackData(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching feedback data:', error);
            }
        };

        fetchFeedbackData();
    }, []);

    // Calculate comprehensive analytics
    const getAnalytics = () => {
        if (!complaints.length) {
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

        const total = complaints.length;
        const now = new Date();

        // This month complaints
        const thisMonth = complaints.filter(c => {
            const complaintDate = new Date(c.createdAt);
            return complaintDate.getMonth() === now.getMonth() && 
                   complaintDate.getFullYear() === now.getFullYear();
        }).length;

        // Monthly trends (last 6 months)
        const monthlyTrends = [];
        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const count = complaints.filter(c => {
                const complaintDate = new Date(c.createdAt);
                return complaintDate.getMonth() === targetDate.getMonth() && 
                       complaintDate.getFullYear() === targetDate.getFullYear();
            }).length;
            monthlyTrends.push({ month: monthName, complaints: count });
        }

        // Status distribution
        const statusCount = {};
        complaints.forEach(c => {
            statusCount[c.status] = (statusCount[c.status] || 0) + 1;
        });
        const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({
            status,
            count,
            percentage: ((count / total) * 100).toFixed(1)
        }));

        // Department breakdown
        const deptCount = {};
        complaints.forEach(c => {
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
        complaints.forEach(c => {
            priorityCount[c.priority] = (priorityCount[c.priority] || 0) + 1;
        });
        const priorityDistribution = Object.entries(priorityCount).map(([priority, count]) => ({
            priority,
            count
        }));

        // Calculate average resolution time
        const resolvedComplaints = complaints.filter(c => 
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

        // Recent activity (last 10 complaints)
        const recentActivity = complaints
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
                pending: complaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length,
                avgResolutionTime
            },
            feedbackStats
        };
    };

    // Download data as CSV
    const downloadCSV = (data, filename) => {
        setLoading(true);
        try {
            let csvContent = '';
            
            if (filename.includes('complaints')) {
                // Complaints data
                csvContent = "ID,Title,Status,Department,Priority,Created Date,User\n";
                complaints.forEach(c => {
                    csvContent += `"${c._id}","${c.title}","${c.status}","${c.department?.name || 'Unknown'}","${c.priority}","${new Date(c.createdAt).toLocaleDateString()}","${c.user?.username || 'Unknown'}"\n`;
                });
            } else if (filename.includes('department')) {
                // Department breakdown
                csvContent = "Department,Count,Percentage\n";
                data.forEach(d => {
                    csvContent += `"${d.department}","${d.count}","${d.percentage}%"\n`;
                });
            } else if (filename.includes('feedback')) {
                // Feedback data
                csvContent = "Complaint ID,Rating,Comments,Date\n";
                feedbackData.forEach(f => {
                    csvContent += `"${f.complaint?._id || 'Unknown'}","${f.rating}","${f.comments || 'No comments'}","${new Date(f.createdAt).toLocaleDateString()}"\n`;
                });
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
        } catch (error) {
            console.error('Error downloading CSV:', error);
        } finally {
            setLoading(false);
        }
    };

    // Download comprehensive analytics report
    const downloadFullReport = () => {
        setLoading(true);
        try {
            const analytics = getAnalytics();
            const date = new Date().toLocaleDateString();
            
            let reportContent = `Complaint Management System - Analytics Report\n`;
            reportContent += `Generated on: ${date}\n\n`;
            
            reportContent += `SUMMARY STATISTICS\n`;
            reportContent += `Total Complaints: ${analytics.total}\n`;
            reportContent += `This Month: ${analytics.thisMonth}\n`;
            reportContent += `Average Resolution Time: ${analytics.avgResolutionTime} days\n`;
            reportContent += `Customer Satisfaction Rate: ${analytics.satisfactionRate}%\n\n`;
            
            reportContent += `STATUS DISTRIBUTION\n`;
            analytics.statusDistribution.forEach(s => {
                reportContent += `${s.status}: ${s.count} (${s.percentage}%)\n`;
            });
            
            reportContent += `\nDEPARTMENT BREAKDOWN\n`;
            analytics.departmentBreakdown.forEach(d => {
                reportContent += `${d.department}: ${d.count} (${d.percentage}%)\n`;
            });
            
            reportContent += `\nFEEDBACK STATISTICS\n`;
            reportContent += `Total Feedback Received: ${analytics.feedbackStats.totalFeedback}\n`;
            reportContent += `Average Rating: ${analytics.feedbackStats.averageRating}/5\n`;
            reportContent += `Satisfaction Rate: ${analytics.feedbackStats.satisfactionRate}%\n`;

            const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `analytics-report-${date.replace(/\//g, '-')}.txt`;
            link.click();
        } catch (error) {
            console.error('Error downloading report:', error);
        } finally {
            setLoading(false);
        }
    };

    const analytics = getAnalytics();

    // Chart colors
    const COLORS = ['#e74c3c', '#f39c12', '#27ae60', '#3498db', '#9b59b6', '#1abc9c'];

    return (
        <div className="analytics-container">
            <div className="analytics-header">
                <h1>Analytics Dashboard</h1>
                <div className="analytics-actions">
                    <button 
                        className="download-btn primary"
                        onClick={downloadFullReport}
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Download Full Report'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
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
                    <span className="analytics-number">{analytics.avgResolutionTime} days</span>
                </div>
                <div className="analytics-card">
                    <h3>Satisfaction Rate</h3>
                    <span className="analytics-number">{analytics.satisfactionRate}%</span>
                </div>
            </div>

            {/* Charts Section */}
            <div className="charts-section">
                {/* Monthly Trends Chart */}
                <div className="chart-container">
                    <div className="chart-header">
                        <h3>Monthly Trends (Last 6 Months)</h3>
                        <button 
                            className="download-btn secondary"
                            onClick={() => downloadCSV(analytics.monthlyTrends, 'monthly-trends.csv')}
                        >
                            Export CSV
                        </button>
                    </div>
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

                {/* Status Distribution Chart */}
                <div className="chart-container">
                    <div className="chart-header">
                        <h3>Status Distribution</h3>
                        <button 
                            className="download-btn secondary"
                            onClick={() => downloadCSV(analytics.statusDistribution, 'status-distribution.csv')}
                        >
                            Export CSV
                        </button>
                    </div>
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

                {/* Department Breakdown Chart */}
                <div className="chart-container">
                    <div className="chart-header">
                        <h3>Department Breakdown</h3>
                        <button 
                            className="download-btn secondary"
                            onClick={() => downloadCSV(analytics.departmentBreakdown, 'department-breakdown.csv')}
                        >
                            Export CSV
                        </button>
                    </div>
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

                {/* Priority Distribution Chart */}
                <div className="chart-container">
                    <div className="chart-header">
                        <h3>Priority Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.priorityDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="priority" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#f39c12" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Data Tables Section */}
            <div className="tables-section">
                {/* Department Performance Table */}
                <div className="table-container">
                    <div className="table-header">
                        <h3>Department Performance</h3>
                        <button 
                            className="download-btn secondary"
                            onClick={() => downloadCSV(analytics.departmentBreakdown, 'department-performance.csv')}
                        >
                            Export CSV
                        </button>
                    </div>
                    <div className="analytics-table-wrapper">
                        <table className="analytics-table">
                            <thead>
                                <tr>
                                    <th>Department</th>
                                    <th>Total Complaints</th>
                                    <th>Percentage</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.departmentBreakdown.map((dept, index) => (
                                    <tr key={index}>
                                        <td>{dept.department}</td>
                                        <td>{dept.count}</td>
                                        <td>{dept.percentage}%</td>
                                        <td>
                                            <div className="progress-bar">
                                                <div 
                                                    className="progress-fill"
                                                    style={{ width: `${dept.percentage}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recent Activity Table */}
                <div className="table-container">
                    <div className="table-header">
                        <h3>Recent Activity</h3>
                        <button 
                            className="download-btn secondary"
                            onClick={() => downloadCSV(complaints, 'all-complaints.csv')}
                        >
                            Export All Complaints
                        </button>
                    </div>
                    <div className="analytics-table-wrapper">
                        <table className="analytics-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Status</th>
                                    <th>Department</th>
                                    <th>User</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.recentActivity.map((activity, index) => (
                                    <tr key={index}>
                                        <td>{activity.title}</td>
                                        <td>
                                            <span className={`status-badge ${activity.status.toLowerCase().replace(' ', '-')}`}>
                                                {activity.status}
                                            </span>
                                        </td>
                                        <td>{activity.department}</td>
                                        <td>{activity.user}</td>
                                        <td>{activity.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Feedback Analytics Table */}
                {feedbackData.length > 0 && (
                    <div className="table-container">
                        <div className="table-header">
                            <h3>Feedback Analytics</h3>
                            <button 
                                className="download-btn secondary"
                                onClick={() => downloadCSV(feedbackData, 'feedback-data.csv')}
                            >
                                Export Feedback
                            </button>
                        </div>
                        <div className="analytics-table-wrapper">
                            <table className="analytics-table">
                                <thead>
                                    <tr>
                                        <th>Rating</th>
                                        <th>Comments</th>
                                        <th>Date</th>
                                        <th>User</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedbackData.slice(0, 10).map((feedback, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="rating-display">
                                                    {[...Array(5)].map((star, i) => (
                                                        <span 
                                                            key={i} 
                                                            className={i < feedback.rating ? 'star filled' : 'star'}
                                                        >
                                                            ★
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td>{feedback.comments || 'No comments'}</td>
                                            <td>{new Date(feedback.createdAt).toLocaleDateString()}</td>
                                            <td>{feedback.submittedBy?.username || 'Unknown'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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
    const [searchTerm, setSearchTerm] = useState(''); // New state for search

    const currentView = location.pathname.split('/').pop() || 'dashboard';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const handleSearchChange = (term) => {
        setSearchTerm(term);
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
        // Clear search term when changing views
        setSearchTerm('');
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
                return (
                    <ComplaintsTable 
                        complaints={filteredComplaints} 
                        onStatusUpdate={handleStatusUpdate} 
                        adminDepartment={adminDepartment}
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                    />
                );
            default:
                return (
                    <ComplaintsTable 
                        complaints={complaints} 
                        onStatusUpdate={handleStatusUpdate} 
                        adminDepartment={adminDepartment}
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                    />
                );
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