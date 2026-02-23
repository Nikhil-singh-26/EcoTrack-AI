const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  toggleDevice
} = require('../controllers/device.controller');

// All device routes are protected
router.route('/')
  .get(protect, getDevices)
  .post(protect, createDevice);

router.route('/:id')
  .get(protect, getDevice)
  .put(protect, updateDevice)
  .delete(protect, deleteDevice);

router.patch('/:id/toggle', protect, toggleDevice);

module.exports = router;