const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { askEnergyCopilot } = require('../controllers/ai.controller');
const rateLimit = require('express-rate-limit');

// Rate limit for AI calls to save API tokens
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 questions per hour
  message: { message: 'Too many questions. Please try again in an hour.' }
});

router.post('/copilot', protect, aiLimiter, askEnergyCopilot);

module.exports = router;
