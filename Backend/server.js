const mongoose = require('mongoose');
const express = require('express')

const app = express()

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log('Server is running on port', process.env.PORT)
        })
    })
    .catch((err) => {
        console.log(err);
    })