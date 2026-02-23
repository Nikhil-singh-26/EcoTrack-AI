const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getLeaderboard, updateProfile } = require('../controllers/user.controller'); // You'll need to create these controllers

// Get leaderboard (public or protected? We'll make it protected but could be public)
router.get('/leaderboard', protect, getLeaderboard);

// Update user profile
router.put('/profile', protect, updateProfile);

module.exports = router;