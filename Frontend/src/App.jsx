// Frontend/src/App.jsx (Updated with Super Admin routes)

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/userDash';
import ComplaintPage from './pages/complaintPage';
import ViewComplaints from './pages/viewComplaints';
import ProfilePage from './pages/userProfilePage';
import AdminDashboard from './pages/adminDash';
import AdminProfilePage from './pages/adminProfilePage';
import SuperAdminDashboard from './pages/superAdminDashboard'; 
import ProtectedRoute from './components/protectedRoutes';
import ComplaintDetails from './pages/complaintDetails';
import NotificationPage from './pages/notificationPage';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* User routes - require user role */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute requiredRole="user">
                            <UserDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/complaintPage" 
                    element={
                        <ProtectedRoute requiredRole="user">
                            <ComplaintPage />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/complaintPage/:id" 
                    element={
                        <ProtectedRoute requiredRole="user">
                            <ComplaintPage />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/viewComplaints" 
                    element={
                        <ProtectedRoute requiredRole="user">
                            <ViewComplaints />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/profile" 
                    element={
                        <ProtectedRoute requiredRole="user">
                            <ProfilePage />
                        </ProtectedRoute>
                    } 
                />
                
                <Route
                    path="/notifications"
                    element={
                        <ProtectedRoute requiredRole="user">
                            <NotificationPage />
                        </ProtectedRoute>
                    }
                />

                {/* Admin routes - require admin role */}
                <Route 
                    path="/admin/dashboard" 
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/new" 
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/complaint/:id" 
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <ComplaintDetails />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/in-progress" 
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/resolved" 
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/analytics" 
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/admin/profile" 
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminProfilePage />
                        </ProtectedRoute>
                    } 
                />

                {/* Super Admin routes - require superadmin role */}
                <Route 
                    path="/super-admin/dashboard" 
                    element={
                        <ProtectedRoute requiredRole="superadmin">
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/super-admin/users" 
                    element={
                        <ProtectedRoute requiredRole="superadmin">
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/super-admin/departments" 
                    element={
                        <ProtectedRoute requiredRole="superadmin">
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    } 
                />

                {/* Catch all route - redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;