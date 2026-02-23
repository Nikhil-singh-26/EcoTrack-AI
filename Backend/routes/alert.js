const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getAlerts, markAlertRead } = require('../controllers/alert.controller'); // Create these

router.get('/', protect, getAlerts);
router.patch('/:id/read', protect, markAlertRead);

module.exports = router;
