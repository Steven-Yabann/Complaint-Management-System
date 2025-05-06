const express = require('express');
const {loginUser} = require('../Controller/auth_controller');
const router = express.Router();

router.post('/login', loginUser);

module.exports = router;