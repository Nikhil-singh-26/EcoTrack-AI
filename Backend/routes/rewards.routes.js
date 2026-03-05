const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getRewards } = require('../controllers/rewards.controller');

router.get('/', protect, getRewards);

module.exports = router;
