const User = require('../models/User');

// @desc    Get all doctors
// @route   GET /api/users/doctors
// @access  Protected
const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password -role');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getDoctors,
};
