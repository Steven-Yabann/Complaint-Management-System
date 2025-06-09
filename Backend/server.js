require('dotenv').config({ path: './config.env' }); 
const express = require('express');
const connectDB = require('./DB/conn'); 
const authRoutes = require('./Routes/auth_router'); 
const cors = require('cors'); 


const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Allows the server to accept JSON data in the request body

// Define Routes
app.use('/api', authRoutes); // All auth routes will be prefixed with /api

// Simple test route
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});