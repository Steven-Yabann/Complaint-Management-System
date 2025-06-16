
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'; // <-- NEW: Added Navigate
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/userDash'; // Note: component name is UserDashboard, file name is userDash.jsx
import ComplaintPage from './pages/complaintPage'; // Note: component name is ComplaintPage, file name is complaintPage.jsx
import ViewComplaints from './pages/viewComplaints'; // Note: component name is ViewComplaints, file name is viewComplaints.jsx
import ProfilePage from './pages/ProfilePage'; // NEW: Importing ProfilePage component

const PrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('token'); // Check for token
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />

                {/* Route for creating new complaints */}
                <Route path="/complaintPage" element={<PrivateRoute><ComplaintPage /></PrivateRoute>} />
                {/* NEW: Route for editing existing complaints (with ID parameter) */}
                <Route path="/complaintPage/:id" element={<PrivateRoute><ComplaintPage /></PrivateRoute>} />

                {/* Path for viewing all complaints - ensuring consistency with previous steps */}
                <Route path="/viewComplaints" element={<PrivateRoute><ViewComplaints /></PrivateRoute>} />
                {/* NEW: Route for user profile page */}
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

            </Routes>
        </Router>
    )
}

export default App;