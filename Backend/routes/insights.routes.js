const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getInsights } = require('../controllers/insights.controller');
const cacheMiddleware = require('../middleware/cacheMiddleware');

// Get AI Insights - cache for 1 hour
router.get('/', protect, cacheMiddleware(3600), getInsights);

module.exports = router;
