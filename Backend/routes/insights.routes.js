const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getInsights, getAIReport } = require('../controllers/insights.controller');
const cacheMiddleware = require('../middleware/cacheMiddleware');

// Get AI Insights (Rule-based) - cache for 1 hour
router.get('/', protect, cacheMiddleware(3600), getInsights);

// Get Detailed AI Report (LLM-based) - cache for 2 hours (expensive)
router.get('/ai-report', protect, cacheMiddleware(7200), getAIReport);

module.exports = router;
