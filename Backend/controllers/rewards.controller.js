const UserRewards = require('../models/UserRewards');

/**
 * @desc    Get user points and badges
 * @route   GET /api/rewards
 * @access  Private
 */
exports.getRewards = async (req, res) => {
  try {
    const userId = req.user.id;
    let rewards = await UserRewards.findOne({ userId });
    
    if (!rewards) {
      rewards = await UserRewards.create({ userId });
    }

    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rewards" });
  }
};

/**
 * @desc    Award points for eco-actions
 */
exports.addPoints = async (userId, points, badgeName = null) => {
  try {
    const update = { $inc: { points } };
    if (badgeName) {
      update.$push = { badges: { name: badgeName, icon: '🌟' } };
    }
    await UserRewards.findOneAndUpdate({ userId }, update, { upsert: true });
  } catch (error) {
    console.error('Error adding points:', error);
  }
};
