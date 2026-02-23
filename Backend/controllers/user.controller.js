const User = require('../models/User');

// @desc    Get leaderboard (top users by energy saved)
// @route   GET /api/users/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    // Fetch top 10 users based on totalEnergySaved (descending)
    const users = await User.find({ role: 'user' })
      .select('name totalEnergySaved rank')
      .sort({ totalEnergySaved: -1 })
      .limit(10);

    // If rank is not set, assign based on order
    const leaderboard = users.map((user, index) => ({
      _id: user._id,
      name: user.name,
      totalEnergySaved: user.totalEnergySaved || 0,
      rank: user.rank || index + 1
    }));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, location, energyGoal } = req.body;
    const userId = req.user.id;

    // Build update object (only allowed fields)
    const updateFields = {};
    if (name) updateFields.name = name;
    if (location) updateFields.location = location;
    if (energyGoal) updateFields.energyGoal = energyGoal;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getLeaderboard,
  updateProfile
};