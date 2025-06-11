import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/login';
import Register from './pages/Register';
import UserDashboard from './pages/userDash';
import ComplaintPage from './pages/complaintPage';

const PrivateRoute = ({ children }) => {
    const isAuthenticated = localStorage.getItem('token'); // Check for token
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login/>}/> 
        <Route path="/register" element={<Register/>}/>

        <Route path="/dashboard" element={<PrivateRoute> <UserDashboard /> </PrivateRoute>}/>

        <Route path="/complaintPage" element={<PrivateRoute><ComplaintPage /></PrivateRoute>}/>
              

      </Routes>
    </Router>
  )
}

export default App
