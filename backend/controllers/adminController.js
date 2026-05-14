const Appointment = require('../models/Appointment');
const User = require('../models/User');


const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('en-CA');


    const totalPatients = await Appointment.countDocuments({ date: today });


    const statusStats = await Appointment.aggregate([
      { $match: { date: today } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);


    const doctorStats = await Appointment.aggregate([
      { $match: { date: today } },
      { $group: { 
          _id: '$doctorId', 
          doneCount: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
          totalCount: { $sum: 1 }
        }
      }
    ]);

    // Populate doctor names for the stats
    const performanceData = await Promise.all(doctorStats.map(async (stat) => {
      const doctor = await User.findById(stat._id).select('name');
      return {
        name: doctor ? doctor.name : 'Unknown',
        done: stat.doneCount,
        total: stat.totalCount
      };
    }));

    // 4. Calculate facility average wait time
    const waitingCount = await Appointment.countDocuments({ date: today, status: 'waiting' });
    const doctorCount = await User.countDocuments({ role: 'doctor' });
    const avgWaitTime = doctorCount > 0 ? Math.round((waitingCount * 15) / doctorCount) : 0;

    res.json({
      totalPatients,
      avgWaitTime,
      activeDoctors: doctorCount,
      statusStats: statusStats.map(s => ({ name: s._id, value: s.count })),
      performanceData
    });

  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
};
