const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const cacheMiddleware = require('../middleware/cacheMiddleware');
const { 
  getRealTimeData, 
  getChartData, 
  predictBill, 
  getCarbonFootprint, 
  simulateData,
  getEnergyStats,
  getDeviceRanking
} = require('../controllers/energy.controller');

// Real-time energy data
router.get('/realtime', protect, getRealTimeData);

// Energy data for charts
router.get('/chart', protect, getChartData);

// Energy stats (Aggregated) - cache for 5 mins
router.get('/stats', protect, cacheMiddleware(300), getEnergyStats);

// Device ranking - cache for 30 mins
router.get('/devices-ranking', protect, cacheMiddleware(1800), getDeviceRanking);

// Predict bill
router.get('/predict-bill', protect, predictBill);

// Carbon footprint
router.get('/carbon-footprint', protect, getCarbonFootprint);

// Simulate IoT data
router.post('/simulate', protect, simulateData);

router.post("/predict-bill", predictBill);

module.exports = router;
