require('dotenv').config({ path: './config.env' }); 
const express = require('express');
const connectDB = require('./DB/conn'); 
const authRoutes = require('./Routes/auth_router'); 
const cors = require('cors'); 
const path =require('path');

const errorHandler = require('./middleware/error');
const departmentRoutes = require('./Routes/departmentRoutes');
const complaintRoutes = require('./Routes/complaint_router');

const userRoutes = require('./Routes/userRoutes'); // Import user routes if needed
const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Allows the server to accept JSON data in the request body
app.use(express.static(path.join(__dirname, 'public'))); //This tells Express to look for static files in the specified directory when a request comes in for them



// Define Routes
app.use('/api', authRoutes); // All auth routes will be prefixed with /api
app.use('/api/departments', departmentRoutes); // All department routes will be prefixed with /api
app.use('/api/complaints',complaintRoutes);

app.use('/api/users', userRoutes); // All user routes will be prefixed with /api

// Simple test route
app.get('/', (req, res) => {
    res.send('API is running...');
});

//errorhandler
app.use(errorHandler);


// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//catch unhandles promise connections (like dbs issues)
process.on('unhandledRejection', (err, promise) => {
    console.log(`Logged Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
})