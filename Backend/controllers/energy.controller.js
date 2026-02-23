const EnergyReading = require('../models/EnergyReading');
const Device = require('../models/Device');
const Alert = require('../models/Alert');

// @desc    Get real-time energy data
// @route   GET /api/energy/realtime
// @access  Private
const getRealTimeData = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get latest reading from each device
    const readings = await EnergyReading.aggregate([
      { $match: { userId: mongoose.Types.ObjectId(userId) } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: '$deviceId',
          latestReading: { $first: '$$ROOT' }
        }
      }
    ]);
    
    const totalConsumption = readings.reduce((sum, r) => sum + r.latestReading.consumption, 0);
    const totalCost = readings.reduce((sum, r) => sum + r.latestReading.cost, 0);
    const totalCarbon = readings.reduce((sum, r) => sum + r.latestReading.carbonFootprint, 0);
    
    res.json({
      success: true,
      data: {
        timestamp: new Date(),
        totalConsumption,
        totalCost,
        totalCarbon,
        activeDevices: readings.length,
        readings: readings.map(r => r.latestReading)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get energy data for charts
// @route   GET /api/energy/chart
// @access  Private
const getChartData = async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    const userId = req.user.id;
    
    let groupFormat;
    let dateRange;
    
    const now = new Date();
    
    switch(period) {
      case 'daily':
        dateRange = new Date(now.setHours(0, 0, 0, 0));
        groupFormat = { $hour: '$timestamp' };
        break;
      case 'weekly':
        dateRange = new Date(now.setDate(now.getDate() - 7));
        groupFormat = { $dayOfWeek: '$timestamp' };
        break;
      case 'monthly':
        dateRange = new Date(now.setMonth(now.getMonth() - 1));
        groupFormat = { $dayOfMonth: '$timestamp' };
        break;
      default:
        dateRange = new Date(now.setHours(0, 0, 0, 0));
        groupFormat = { $hour: '$timestamp' };
    }
    
    const data = await EnergyReading.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId(userId),
          timestamp: { $gte: dateRange }
        }
      },
      {
        $group: {
          _id: groupFormat,
          consumption: { $sum: '$consumption' },
          cost: { $sum: '$cost' },
          carbon: { $sum: '$carbonFootprint' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data,
      period
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Predict bill using AI
// @route   GET /api/energy/predict-bill
// @access  Private
const predictBill = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const readings = await EnergyReading.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo }
    }).sort({ timestamp: 1 });
    
    if (readings.length === 0) {
      return res.json({
        success: true,
        data: {
          predictedBill: 0,
          confidence: 0,
          message: 'Not enough data for prediction'
        }
      });
    }
    
    // Simple linear regression for prediction
    const dailyConsumption = {};
    readings.forEach(r => {
      const date = r.timestamp.toISOString().split('T')[0];
      if (!dailyConsumption[date]) {
        dailyConsumption[date] = 0;
      }
      dailyConsumption[date] += r.consumption;
    });
    
    const days = Object.keys(dailyConsumption).sort();
    const values = days.map(d => dailyConsumption[d]);
    
    // Calculate trend
    const avgConsumption = values.reduce((a, b) => a + b, 0) / values.length;
    const trend = values.length > 1 ? (values[values.length - 1] - values[0]) / values.length : 0;
    
    // Predict next 30 days
    const predictedDailyAvg = avgConsumption + (trend * 15); // Adjust for mid-point
    const predictedMonthly = predictedDailyAvg * 30;
    
    // Calculate cost (assuming $0.12 per kWh)
    const ratePerKwh = 0.12;
    const predictedBill = predictedMonthly * ratePerKwh;
    
    // Calculate confidence based on data consistency
    const variance = values.reduce((a, b) => a + Math.pow(b - avgConsumption, 2), 0) / values.length;
    const confidence = Math.max(0, Math.min(100, 100 - (variance / avgConsumption * 10)));
    
    res.json({
      success: true,
      data: {
        predictedBill: Math.round(predictedBill * 100) / 100,
        predictedConsumption: Math.round(predictedMonthly * 100) / 100,
        confidence: Math.round(confidence),
        trend: trend > 0 ? 'increasing' : 'decreasing',
        averageDaily: Math.round(avgConsumption * 100) / 100
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Calculate carbon footprint
// @route   GET /api/energy/carbon-footprint
// @access  Private
const getCarbonFootprint = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    
    switch(period) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    const readings = await EnergyReading.find({
      userId,
      timestamp: { $gte: startDate }
    });
    
    const totalConsumption = readings.reduce((sum, r) => sum + r.consumption, 0);
    const totalCarbon = readings.reduce((sum, r) => sum + r.carbonFootprint, 0);
    
    // Compare to average (assuming average household emits 500kg CO2/month)
    const averageCarbon = 500;
    const comparison = totalCarbon - averageCarbon;
    
    // Trees needed to offset (1 tree absorbs ~22kg CO2 per year)
    const treesNeeded = Math.ceil(totalCarbon / 22);
    
    res.json({
      success: true,
      data: {
        period,
        totalConsumption: Math.round(totalConsumption * 100) / 100,
        totalCarbon: Math.round(totalCarbon * 100) / 100,
        comparison: Math.round(comparison * 100) / 100,
        treesNeeded,
        isEfficient: totalCarbon < averageCarbon
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Simulate IoT device data
// @route   POST /api/energy/simulate
// @access  Private
const simulateData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId, hours = 1 } = req.body;
    
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ message: 'Device not found' });
    }
    
    // Generate simulated reading
    const consumption = (device.powerRating * hours) / 1000;
    const cost = consumption * 0.12; // $0.12 per kWh
    const carbonFootprint = consumption * parseFloat(process.env.CO2_FACTOR || 0.85);
    
    const reading = await EnergyReading.create({
      userId,
      deviceId,
      consumption,
      cost,
      carbonFootprint,
      voltage: 220 + (Math.random() * 10 - 5),
      current: (device.powerRating / 220) * (Math.random() * 0.2 + 0.9),
      source: 'simulated'
    });
    
    // Update device daily usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingUsage = device.dailyUsage.find(u => 
      new Date(u.date).setHours(0, 0, 0, 0) === today.getTime()
    );
    
    if (existingUsage) {
      existingUsage.hoursUsed += hours;
      existingUsage.energyConsumed += consumption;
    } else {
      device.dailyUsage.push({
        date: today,
        hoursUsed: hours,
        energyConsumed: consumption
      });
    }
    
    await device.save();
    
    // Check for high usage alert
    if (consumption > device.powerRating * 24 / 1000 * 0.8) { // 80% of max daily
      await Alert.create({
        userId,
        deviceId,
        type: 'high-usage',
        severity: 'warning',
        title: 'High Energy Usage Detected',
        message: `${device.name} is consuming more energy than usual`,
        value: consumption,
        threshold: device.powerRating * 24 / 1000 * 0.8
      });
    }
    
    // Emit real-time update via WebSocket
    const io = req.app.get('io');
    io.emit('energy-update', {
      userId,
      deviceId,
      reading
    });
    
    res.json({
      success: true,
      data: reading
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getRealTimeData,
  getChartData,
  predictBill,
  getCarbonFootprint,
  simulateData
};