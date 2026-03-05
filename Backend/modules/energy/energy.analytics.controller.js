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
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    
    // Aggregate to find highest usage day and avg weekly usage
    const stats = await EnergyReading.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          dailyTotal: { $sum: "$consumption" }
      }},
      { $sort: { dailyTotal: -1 } }
    ]);

    const highestUsageDay = stats[0] || { _id: "N/A", dailyTotal: 0 };
    const avgWeekly = stats.slice(0, 7).reduce((acc, curr) => acc + curr.dailyTotal, 0) / 7;

    res.json({
      success: true,
      data: {
        highestUsageDay: highestUsageDay._id,
        highestUsageValue: highestUsageDay.dailyTotal.toFixed(2),
        averageWeeklyUsage: avgWeekly.toFixed(2),
        estimatedMonthlyBill: (avgWeekly * 30 * (parseFloat(process.env.ELECTRICITY_RATE) || 0.12)).toFixed(2),
        savingSuggestion: "Switch off your largest consumer during 6 PM - 10 PM to save 12% on your next bill."
      }
    });

  } catch (error) {
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
