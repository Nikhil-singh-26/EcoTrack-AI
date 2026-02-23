const User = require('../models/User');
const EnergyReading = require('../models/EnergyReading');
const Device = require('../models/Device');

// @desc    Get all users (admin only)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    // Optionally, add some stats for each user (e.g., total devices, total energy)
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const deviceCount = await Device.countDocuments({ userId: user._id });
        const totalEnergy = await EnergyReading.aggregate([
          { $match: { userId: user._id } },
          { $group: { _id: null, total: { $sum: '$consumption' } } }
        ]);
        return {
          ...user.toObject(),
          deviceCount,
          totalEnergy: totalEnergy[0]?.total || 0
        };
      })
    );

    res.json({
      success: true,
      data: usersWithStats
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a user (admin only)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete user's devices and energy readings (cascade)
    await Device.deleteMany({ userId: user._id });
    await EnergyReading.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'User and all associated data deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get system statistics (admin only)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDevices = await Device.countDocuments();
    const totalReadings = await EnergyReading.countDocuments();
    
    const totalEnergy = await EnergyReading.aggregate([
      { $group: { _id: null, total: { $sum: '$consumption' } } }
    ]);

    const stats = {
      totalUsers,
      totalDevices,
      totalReadings,
      totalEnergy: totalEnergy[0]?.total || 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getSystemStats
};