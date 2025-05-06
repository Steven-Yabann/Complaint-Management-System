require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./Routes/auth_router')

// Initialize the express app
const app = express();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req, res, next) => {
    console.log( "Server.js: ", req.path, req.method, req.params, req.body);
    next();
});

// Routes
app.use('/login', authRoutes)

app.use((res, req, next) => {
    res.status(404).json({message: "Route not found"});
})

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log('Server is running on port', process.env.PORT)
        })
    })
    .catch((err) => {
        console.log(err);
    })