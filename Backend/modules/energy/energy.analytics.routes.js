const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth');
const { 
  getSmartInsights, 
  getEfficiencyScore, 
  getEnergyTips 
} = require('./energy.analytics.controller');

router.get('/insights', protect, getSmartInsights);
router.get('/efficiency-score', protect, getEfficiencyScore);
router.get('/tips', protect, getEnergyTips);

module.exports = router;
