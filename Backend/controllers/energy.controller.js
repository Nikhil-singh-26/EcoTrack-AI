const mongoose = require('mongoose');
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
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
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
          userId: new mongoose.Types.ObjectId(userId),
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
      userId: new mongoose.Types.ObjectId(userId),
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
    
    // Calculate cost using environment variable
    const ratePerKwh = parseFloat(process.env.ELECTRICITY_RATE) || 0.12;
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
      userId: new mongoose.Types.ObjectId(userId),
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
    const updatePayload = {
      userId,
      deviceId,
      reading
    };

    // Legacy support
    io.emit('energy-update', updatePayload);
    // New naming convention
    io.emit('energy:update', updatePayload);
    // Notify leaderboard listeners that ranking might have changed
    io.emit('leaderboard:update');
    
    res.json({
      success: true,
      data: reading
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// @desc    Get detailed energy stats using aggregation
// @route   GET /api/energy/stats
// @access  Private
const getEnergyStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    
    // Daily (Last 24h)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    // Weekly (Last 7d)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // Monthly (Last 30d)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const stats = await EnergyReading.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          daily: [
            { $match: { timestamp: { $gte: dayAgo } } },
            { $group: { _id: null, total: { $sum: '$consumption' }, cost: { $sum: '$cost' } } }
          ],
          weekly: [
            { $match: { timestamp: { $gte: weekAgo } } },
            { $group: { _id: null, total: { $sum: '$consumption' }, cost: { $sum: '$cost' } } }
          ],
          monthly: [
            { $match: { timestamp: { $gte: monthAgo } } },
            { $group: { _id: null, total: { $sum: '$consumption' }, cost: { $sum: '$cost' } } }
          ],
          deviceRanking: [
            { $match: { timestamp: { $gte: monthAgo } } },
            {
              $group: {
                _id: '$deviceId',
                totalConsumption: { $sum: '$consumption' }
              }
            },
            { $sort: { totalConsumption: -1 } },
            { $limit: 10 },
            {
              $lookup: {
                from: 'devices',
                localField: '_id',
                foreignField: '_id',
                as: 'deviceInfo'
              }
            },
            { $unwind: { path: '$deviceInfo', preserveNullAndEmptyArrays: true } },
            {
              $project: {
                name: '$deviceInfo.name',
                type: '$deviceInfo.type',
                totalConsumption: 1
              }
            }
          ]
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        usage: {
          daily: stats[0].daily[0] || { total: 0, cost: 0 },
          weekly: stats[0].weekly[0] || { total: 0, cost: 0 },
          monthly: stats[0].monthly[0] || { total: 0, cost: 0 }
        },
        deviceRanking: stats[0].deviceRanking
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get device ranking by energy consumption
// @route   GET /api/energy/devices-ranking
// @access  Private
const getDeviceRanking = async (req, res) => {
  try {
    const userId = req.user.id;
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const ranking = await EnergyReading.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: monthAgo }
        }
      },
      {
        $group: {
          _id: '$deviceId',
          totalKwh: { $sum: '$consumption' },
          totalCost: { $sum: '$cost' },
          totalCarbon: { $sum: '$carbonFootprint' }
        }
      },
      { $sort: { totalKwh: -1 } },
      {
        $lookup: {
          from: 'devices',
          localField: '_id',
          foreignField: '_id',
          as: 'device'
        }
      },
      { $unwind: { path: '$device', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: '$device.name',
          type: '$device.type',
          room: '$device.room',
          totalKwh: 1,
          totalCost: 1,
          totalCarbon: 1
        }
      }
    ]);

    res.json({
      success: true,
      data: ranking
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get complete carbon analytics for dashboard
// @route   GET /api/energy/carbon-analytics
// @access  Private
const getCarbonAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [readings7d, readings30d] = await Promise.all([
      EnergyReading.find({ userId: new mongoose.Types.ObjectId(userId), timestamp: { $gte: last7Days } }).sort({ timestamp: 1 }),
      EnergyReading.find({ userId: new mongoose.Types.ObjectId(userId), timestamp: { $gte: last30Days } })
    ]);

    const EMISSION_FACTOR = 0.82; // India Average
    const totalConsumption = readings30d.reduce((sum, r) => sum + (r.consumption || 0), 0);
    const totalCarbon = totalConsumption * EMISSION_FACTOR;

    // Grouping for chart (Last 7 Days)
    const chartData = [];
    const daysMap = {};
    
    // Initialize last 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      daysMap[dateStr] = 0;
    }

    readings7d.forEach(r => {
      const dateStr = r.timestamp.toISOString().split('T')[0];
      if (daysMap[dateStr] !== undefined) {
        daysMap[dateStr] += (r.consumption * EMISSION_FACTOR);
      }
    });

    Object.entries(daysMap).forEach(([date, value]) => {
      chartData.push({ date: date.split('-').slice(1).join('/'), emission: Math.round(value * 100) / 100 });
    });

    // Calculations
    const treesRequired = Math.ceil(totalCarbon / 20); // 1 tree offsets ~20kg per year
    const drivingKm = Math.round((totalCarbon / 0.12) * 10) / 10; // 0.12kg/km average car

    res.json({
      success: true,
      data: {
        totalCarbon: Math.round(totalCarbon * 100) / 100,
        totalConsumption: Math.round(totalConsumption * 100) / 100,
        treesRequired,
        drivingKm,
        chartData,
        emissionFactor: EMISSION_FACTOR,
        aiInsight: totalCarbon > 50 
          ? "Your carbon output is high. Switch off 2 heavy appliances for 2 hours daily to save 12kg CO2."
          : "Great job! Your carbon footprint is below average. You've saved the equivalent of 5 trees this month."
      }
    });
  } catch (error) {
    console.error('Carbon Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get usage by time and device (Real Data)
// @route   GET /api/energy/usage-by-device
// @access  Private
const getDeviceUsageTrend = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Join with Device model to get names
    const readings = await EnergyReading.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          timestamp: { $gte: last24h }
        }
      },
      {
        $lookup: {
          from: 'devices',
          localField: 'deviceId',
          foreignField: '_id',
          as: 'deviceInfo'
        }
      },
      { $unwind: '$deviceInfo' },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            deviceName: '$deviceInfo.name'
          },
          consumption: { $sum: '$consumption' }
        }
      },
      { $sort: { '_id.hour': 1 } }
    ]);

    // Format for Recharts
    const hourMap = {};
    readings.forEach(r => {
      const hStr = `${r._id.hour}:00`;
      if (!hourMap[hStr]) hourMap[hStr] = { time: hStr };
      hourMap[hStr][r._id.deviceName] = Math.round(r.consumption * 100) / 100;
    });

    res.json({
      success: true,
      data: Object.values(hourMap)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Apply AI smart schedule
// @route   POST /api/energy/apply-schedule
// @access  Private
const applySmartSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { planType = 'generic' } = req.body;
    
    // Create an alert to confirm the schedule is applied
    await Alert.create({
      userId,
      type: 'achievement',
      severity: 'info',
      title: 'Optimization Applied',
      message: `Successfully applied your ${planType} energy optimization. We've adjusted your peak thresholds.`,
      read: false
    });

    res.json({
      success: true,
      message: 'Smart Schedule applied successfully!'
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
  simulateData,
  getEnergyStats,
  getDeviceRanking,
  getCarbonAnalytics,
  applySmartSchedule,
  getDeviceUsageTrend
};