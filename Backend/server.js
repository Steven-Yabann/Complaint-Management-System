// Backend/server.js
require('dotenv').config({ path: './config.env' }); 
const express = require('express');
const connectDB = require('./DB/conn'); 
const authRoutes = require('./Routes/authRoutes'); 
const cors = require('cors'); 
const path = require('path');

const errorHandler = require('./middleware/error');
const departmentRoutes = require('./Routes/departmentRoutes');
const complaintRoutes = require('./Routes/complaintRoutes');
const userRoutes = require('./Routes/userRoutes');
const adminRoutes = require('./Routes/adminRoutes'); // Add admin routes

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Define Routes
app.use('/api', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes); 


// Simple test route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handler
app.use(errorHandler);

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Catch unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Logged Error: ${err.message}`);
    server.close(() => process.exit(1));
});