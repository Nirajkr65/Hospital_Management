const express = require('express');
const router = express.Router();
const { getDoctors } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/doctors', protect, getDoctors);

module.exports = router;
