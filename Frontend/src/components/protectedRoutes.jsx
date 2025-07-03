// Frontend/src/components/protectedRoutes.jsx (Updated for Super Admin support)

import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const token = localStorage.getItem('token');
    
    // Check if user is authenticated
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        // Decode token to check if it's valid and not expired
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        // Check if token is expired
        if (decodedToken.exp < currentTime) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('userRole');
            return <Navigate to="/login" replace />;
        }

        // If a specific role is required, check user's role
        if (requiredRole) {
            const userInfo = decodedToken.user || decodedToken;
            const userRole = userInfo.role || localStorage.getItem('userRole');
            
            if (userRole !== requiredRole) {
                // Redirect to appropriate dashboard based on actual role
                if (userRole === 'superadmin') {
                    return <Navigate to="/super-admin/dashboard" replace />;
                } else if (userRole === 'admin') {
                    return <Navigate to="/admin/dashboard" replace />;
                } else {
                    return <Navigate to="/dashboard" replace />;
                }
            }
        }

        return children;
        
    } catch (error) {
        console.error('Error validating token:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        return <Navigate to="/login" replace />;
    }
};

export default ProtectedRoute;