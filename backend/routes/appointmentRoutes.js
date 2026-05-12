const express = require('express');
const router = express.Router();
const { createAppointment, getUserAppointments, updateAppointmentStatus, getQueueStatus, getPublicQueue } = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/public/all', getPublicQueue);
router.post('/', protect, createAppointment);
router.get('/:userId', protect, getUserAppointments);
router.get('/:id/queue-status', protect, getQueueStatus);
router.put('/:id/status', protect, authorize('doctor', 'admin'), updateAppointmentStatus);

module.exports = router;
