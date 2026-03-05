const EnergyReading = require('../models/EnergyReading');
const Device = require('../models/Device');

/**
 * Analyzes device data and provides actionable insights
 * @param {string} userId - ID of the user
 * @returns {Promise<Object>} - Insights object
 */
const generateEnergyInsights = async (userId) => {
  const devices = await Device.find({ userId });
  
  // Get last 30 days of readings
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const readings = await EnergyReading.find({
    userId,
    timestamp: { $gte: thirtyDaysAgo }
  });

  if (readings.length === 0) {
    return {
      success: true,
      message: "Not enough data for insights. Start by using your devices!",
      recommendations: []
    };
  }

  const totalConsumption = readings.reduce((sum, r) => sum + r.consumption, 0);
  
  // Group consumption by device
  const deviceStats = {};
  readings.forEach(r => {
    if (r.deviceId) {
      const dId = r.deviceId.toString();
      if (!deviceStats[dId]) deviceStats[dId] = 0;
      deviceStats[dId] += r.consumption;
    }
  });

  const recommendations = [];

  // Identify energy hogs
  const highUsageDevices = devices
    .map(d => ({
      name: d.name,
      consumption: deviceStats[d._id.toString()] || 0,
      powerRating: d.powerRating,
      percentage: totalConsumption > 0 ? ((deviceStats[d._id.toString()] || 0) / totalConsumption) * 100 : 0
    }))
    .sort((a, b) => b.consumption - a.consumption);

  // Recommendation logic
  highUsageDevices.forEach(d => {
    if (d.percentage > 30) {
      const savingPotential = (d.consumption / d.percentage) * (d.percentage * 0.1); // 10% reduction
      recommendations.push({
        priority: 'high',
        device: d.name,
        action: `Reduce usage of ${d.name} by 1 hour/day.`,
        impact: `${d.percentage.toFixed(1)}% of total energy. Saving approx ${savingPotential.toFixed(2)} kWh/month.`
      });
    }
  });

  return {
    summary: {
      totalConsumption: totalConsumption.toFixed(2),
      monitoredDevices: devices.length,
      topHog: highUsageDevices[0] ? highUsageDevices[0].name : 'N/A'
    },
    recommendations
  };
};

module.exports = { generateEnergyInsights };
