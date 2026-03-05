const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { askEnergyCopilot } = require('./ai.controller');

router.post('/copilot', protect, askEnergyCopilot);

module.exports = router;
