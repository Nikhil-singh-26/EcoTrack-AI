const EnergyReading = require('../../models/EnergyReading');
const Device = require('../../models/Device');
const Alert = require('../../models/Alert');
const mongoose = require('mongoose');

/**
 * @desc    Get Smart Energy Insights (Feature 2)
 */
exports.getSmartInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Aggregates for highest usage day and avg weekly usage
    const stats = await EnergyReading.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), timestamp: { $gte: last7Days } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          dailyTotal: { $sum: "$consumption" }
      }},
      { $sort: { dailyTotal: -1 } }
    ]);

    // Aggregate to find the top consuming device in last 7 days
    const deviceStats = await EnergyReading.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), timestamp: { $gte: last7Days } } },
      { $group: {
          _id: "$deviceId",
          total: { $sum: "$consumption" }
      }},
      { $sort: { total: -1 } },
      { $limit: 1 },
      { $lookup: {
          from: 'devices',
          localField: '_id',
          foreignField: '_id',
          as: 'deviceInfo'
      }},
      { $unwind: '$deviceInfo' }
    ]);

    const highestUsageDay = stats[0] || { _id: "N/A", dailyTotal: 0 };
    const totalWeekly = stats.reduce((acc, curr) => acc + curr.dailyTotal, 0);
    const avgWeekly = stats.length > 0 ? totalWeekly / stats.length : 0;
    
    // Create REAL Suggestion
    const topDevice = deviceStats[0];
    let savingSuggestion = "Keep optimizing! Your current usage pattern is stable.";
    
    if (topDevice && totalWeekly > 0) {
      const percentage = (topDevice.total / totalWeekly) * 100;
      const potentialSaving = (percentage * 0.1).toFixed(1); // Assuming 10% reduction
      savingSuggestion = `Your ${topDevice.deviceInfo.name} is consuming ${percentage.toFixed(1)}% of your weekly energy. Reducing its usage by 1 hour could save ~${potentialSaving}% on your next bill.`;
    }

    res.json({
      success: true,
      data: {
        highestUsageDay: highestUsageDay._id,
        highestUsageValue: highestUsageDay.dailyTotal.toFixed(2),
        averageWeeklyUsage: avgWeekly.toFixed(2),
        estimatedMonthlyBill: (avgWeekly * 30 * (parseFloat(process.env.ELECTRICITY_RATE) || 0.12)).toFixed(2),
        savingSuggestion
      }
    });

  } catch (error) {
    console.error('Smart Insights Error:', error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
};

/**
 * @desc    Calculate Energy Efficiency Score (Feature 4)
 */
exports.getEfficiencyScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const readings = await EnergyReading.find({ userId }).sort({ timestamp: -1 }).limit(100);
    
    if (readings.length === 0) return res.json({ score: 100, category: "New User", suggestion: "Start tracking to see your score!" });

    const totalConsumption = readings.reduce((sum, r) => sum + r.consumption, 0);
    const avgConsumption = totalConsumption / readings.length;
    
    // Algorithm: Base 100. Deduct points for consumption above average and spikes.
    let score = 100;
    
    // Factor 1: Consumption (Higher usage lowers score)
    if (avgConsumption > 2) score -= 20;
    if (avgConsumption > 5) score -= 20;

    // Factor 2: Spikes (Recent spikes lower score)
    const spikes = readings.filter(r => r.consumption > avgConsumption * 2).length;
    score -= (spikes * 5);

    // Normalize
    score = Math.max(0, Math.min(100, score));

    let category = "Excellent";
    if (score < 40) category = "Poor";
    else if (score < 70) category = "Fair";
    else if (score < 90) category = "Good";

    res.json({
      success: true,
      data: {
        score,
        category,
        suggestion: score < 70 ? "Consider scheduling high-energy devices for low-load hours." : "Keep up the great work! Your footprint is optimized."
      }
    });
  } catch (error) {
        res.status(500).json({ error: "Failed to calculate score" });
  }
};

/**
 * @desc    Get Intelligent Saving Tips (Feature 8)
 */
exports.getEnergyTips = async (req, res) => {
  const tips = [
    { title: "Lighting", tip: "Switch to LED bulbs to save up to 80% on lighting energy.", impact: "High" },
    { title: "Temperature", tip: "Set your AC to 24-26°C. Every degree higher saves 6% electricity.", impact: "Medium" },
    { title: "Appliances", tip: "Clean your refrigerator coils twice a year to improve efficiency by 15%.", impact: "Medium" },
    { title: "Phantom Load", tip: "Turn off power strips at night. Idle electronics still consume power.", impact: "Low" }
  ];
  res.json({ success: true, data: tips });
};
