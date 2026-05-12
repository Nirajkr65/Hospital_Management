const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');

// @desc    Create a new appointment
// @route   POST /api/appointments
// @access  Protected
const createAppointment = async (req, res) => {
  try {
    const { doctorId, date, timeSlot } = req.body;
    const patientId = req.user._id;

    // Optional: Basic validation to check if the doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(400).json({ message: 'Invalid doctor selected' });
    }

    // Auto-increment Token Number logic
    // Find the latest appointment for this doctor on this date
    const lastAppointment = await Appointment.findOne({ doctorId, date })
      .sort({ tokenNumber: -1 })
      .select('tokenNumber');
      
    const tokenNumber = lastAppointment ? lastAppointment.tokenNumber + 1 : 1;

    const appointment = await Appointment.create({
      patientId,
      doctorId,
      date,
      timeSlot,
      tokenNumber,
      status: 'waiting'
    });

    // Extract socket.io instance out of the app globals
    const io = req.app.get('socketio');
    if (io) {
      io.emit('queueUpdated');
    }

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get appointments for a user (patient or doctor)
// @route   GET /api/appointments/:userId
// @access  Protected
const getUserAppointments = async (req, res) => {
  try {
    const { userId } = req.params;

    // Security check: Only allow users to view their own appointments (or admins)
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to view these appointments' });
    }

    // Determine query context: fetch patient history if user is patient, doctor schedule if doctor
    const query = req.user.role === 'doctor' ? { doctorId: userId } : { patientId: userId };

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email address')
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });

    console.log(`[DEBUG] Dashboard Fetch for ${req.user.role}: ${userId}`);
    console.log(`[DEBUG] Found ${appointments.length} total records`);

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Protected (Doctor/Admin)
const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Optional Security: Verify doctor owns this appointment
    if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this appointment' });
    }

    appointment.status = status;
    const updatedAppointment = await appointment.save();

    // -- NOTIFICATION LOGIC --
    // 1. Notify current patient if they are called (Ongoing)
    if (status === 'ongoing') {
      const patient = await User.findById(appointment.patientId);
      if (patient && patient.phone) {
        await sendNotification(
          patient.phone, 
          `Hello ${patient.name}, Dr. ${req.user.name} is ready for you! Please proceed to the consultation room. Token #${appointment.tokenNumber}`
        );
      }
    }

    // 2. Notify the NEXT person in line if current one is Done
    if (status === 'done') {
      const nextInLine = await Appointment.findOne({
        doctorId: appointment.doctorId,
        date: appointment.date,
        status: 'waiting'
      }).sort({ tokenNumber: 1 }).populate('patientId');

      if (nextInLine && nextInLine.patientId && nextInLine.patientId.phone) {
        await sendNotification(
          nextInLine.patientId.phone,
          `Heads up! You are now NEXT in line for Dr. ${req.user.name}. Please be ready! Token #${nextInLine.tokenNumber}`
        );
      }
    }

    // Broadcast the update to connected clients
    const io = req.app.get('socketio');
    if (io) {
      io.emit('queueUpdated');
    }

    res.json(updatedAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get queue status for a specific appointment
// @route   GET /api/appointments/:id/queue-status
// @access  Protected
const getQueueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Optional Security: Patient must own this appointment to fetch stats
    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (appointment.status !== 'waiting') {
      return res.json({ positionAhead: 0, estimatedWaitTime: 0, status: appointment.status });
    }

    const positionAhead = await Appointment.countDocuments({
      doctorId: appointment.doctorId,
      date: appointment.date,
      status: { $in: ['waiting', 'ongoing'] },
      tokenNumber: { $lt: appointment.tokenNumber },
    });

    const AVG_MINUTES_PER_PATIENT = 15;
    const estimatedWaitTime = positionAhead * AVG_MINUTES_PER_PATIENT;

    res.json({ positionAhead, estimatedWaitTime, status: appointment.status });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all active appointments for public display
// @route   GET /api/appointments/public/all
// @access  Public
const getPublicQueue = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');
    const appointments = await Appointment.find({
      date: today,
      status: { $in: ['ongoing', 'waiting'] }
    })
    .populate('doctorId', 'name')
    .select('tokenNumber status doctorId')
    .sort({ tokenNumber: 1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  createAppointment,
  getUserAppointments,
  updateAppointmentStatus,
  getQueueStatus,
  getPublicQueue,
};
