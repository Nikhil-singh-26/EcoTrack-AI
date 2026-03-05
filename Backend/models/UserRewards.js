const mongoose = require('mongoose');

const UserRewardsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0
  },
  badges: [{
    name: String,
    icon: String,
    unlockedAt: {
      type: Date,
      default: Date.now
    }
  }],
  streak: {
    type: Number,
    default: 0
  },
  lastLogin: Date,
  carbonSaved: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('UserRewards', UserRewardsSchema);
