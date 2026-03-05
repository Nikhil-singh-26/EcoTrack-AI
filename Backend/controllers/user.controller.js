const mongoose = require('mongoose');
const User = require('../models/User');
const EnergyReading = require('../models/EnergyReading');
const redisClient = require('../utils/redisClient');

// @desc    Get leaderboard (top users by lowest carbon footprint)
// @route   GET /api/users/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  const cacheKey = 'leaderboard';
  const cacheTTL = 300; // 5 minutes

  try {
    // 1. Try to get from Cache
    if (redisClient.isOpen) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.json({
            success: true,
            data: JSON.parse(cachedData),
            source: 'cache'
          });
        }
      } catch (cacheErr) {
        console.warn('⚠️ Redis GET Error:', cacheErr.message);
      }
    }

    // 2. Fallback to MongoDB
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const rankings = await EnergyReading.aggregate([
      { $match: { timestamp: { $gte: monthAgo } } },
      {
        $group: {
          _id: '$userId',
          totalCarbon: { $sum: '$carbonFootprint' },
          totalSavings: { $sum: '$consumption' }
        }
      },
      { $sort: { totalCarbon: 1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          name: '$userDetails.name',
          totalCarbon: 1,
          totalSavings: 1,
          rank: { $literal: 0 }
        }
      }
    ]);

    const leaderboard = rankings.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // 3. Store in Cache (Background)
    if (redisClient.isOpen) {
      redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(leaderboard)).catch(err => {
        console.warn('⚠️ Redis SET Error:', err.message);
      });
    }

    res.json({
      success: true,
      data: leaderboard,
      source: 'database'
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