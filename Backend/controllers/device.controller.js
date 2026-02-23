const Device = require('../models/Device');
const EnergyReading = require('../models/EnergyReading');

// @desc    Get all devices for user
// @route   GET /api/devices
// @access  Private
const getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ userId: req.user.id });
    
    // Get latest reading for each device
    const devicesWithStats = await Promise.all(
      devices.map(async (device) => {
        const latestReading = await EnergyReading.findOne({
          deviceId: device._id
        }).sort({ timestamp: -1 });
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayUsage = device.dailyUsage.find(u => 
          new Date(u.date).setHours(0, 0, 0, 0) === today.getTime()
        );
        
        return {
          ...device.toObject(),
          currentPower: latestReading ? latestReading.consumption * 1000 / 0.12 : 0, // Convert to watts
          todayUsage: todayUsage ? todayUsage.energyConsumed : 0,
          status: device.status
        };
      })
    );
    
    res.json({
      success: true,
      data: devicesWithStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single device
// @route   GET /api/devices/:id
// @access  Private
const getDevice = async (req, res) => {
  try {
    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Get device readings
    const readings = await EnergyReading.find({
      deviceId: device._id
    }).sort({ timestamp: -1 }).limit(100);
    
    // Calculate statistics
    const totalConsumption = readings.reduce((sum, r) => sum + r.consumption, 0);
    const avgConsumption = readings.length > 0 ? totalConsumption / readings.length : 0;
    
    res.json({
      success: true,
      data: {
        ...device.toObject(),
        readings,
        stats: {
          totalConsumption,
          avgConsumption,
          readingsCount: readings.length
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create device
// @route   POST /api/devices
// @access  Private
const createDevice = async (req, res) => {
  try {
    const { name, type, powerRating, room, isSmart } = req.body;
    
    const device = await Device.create({
      userId: req.user.id,
      name,
      type,
      powerRating,
      room,
      isSmart: isSmart || false
    });
    
    res.status(201).json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update device
// @route   PUT /api/devices/:id
// @access  Private
const updateDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    res.json({
      success: true,
      data: device
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete device
// @route   DELETE /api/devices/:id
// @access  Private
const deleteDevice = async (req, res) => {
  try {
    const device = await Device.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Delete associated readings
    await EnergyReading.deleteMany({ deviceId: device._id });
    
    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Toggle device status
// @route   PATCH /api/devices/:id/toggle
// @access  Private
const toggleDevice = async (req, res) => {
  try {
    const device = await Device.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    device.status = device.status === 'on' ? 'off' : 'on';
    await device.save();
    
    res.json({
      success: true,
      data: {
        id: device._id,
        status: device.status,
        message: `Device turned ${device.status}`
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  toggleDevice
};