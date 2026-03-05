const EnergyReading = require('../../models/EnergyReading');
const Device = require('../../models/Device');

/**
 * @desc    AI Energy Copilot (Rule-based)
 * @route   POST /api/ai/copilot
 * @access  Private
 */
exports.askEnergyCopilot = async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ success: false, message: "Please ask a question." });
    }

    const q = question.toLowerCase();
    
    // 1. Fetch User Data Context
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const [readings, devices] = await Promise.all([
      EnergyReading.find({ userId, timestamp: { $gte: last30Days } }),
      Device.find({ userId })
    ]);

    const totalKwh = readings.reduce((sum, r) => sum + r.consumption, 0);
    const avgDailyKwh = totalKwh / 30;
    
    // Logic for Rule-based intelligence
    let answer = "";
    let tips = [];

    if (q.includes("reduce") || q.includes("lower") || q.includes("bill")) {
      answer = `Based on your usage of ${totalKwh.toFixed(2)} kWh this month, you can save approximately ${(totalKwh * 0.15).toFixed(2)} kWh by optimizing your peak usage.`;
      tips = [
        "Unplug devices not in use (phantom load).",
        "Switch to LED bulbs to reduce lighting consumption by 75%.",
        "Maintain AC temperature at 24°C for high efficiency."
      ];
    } else if (q.includes("high") || q.includes("spike") || q.includes("why")) {
      const highUsageDevice = devices.sort((a,b) => b.powerRating - a.powerRating)[0];
      answer = `I detected that your ${highUsageDevice?.name || 'heavy appliances'} are contributing most to your footprint. Spikes usually occur during evening hours (6 PM - 10 PM).`;
      tips = [
        "Move high-power tasks (laundry, dishwashing) to morning hours.",
        "Check if any appliance is overheating, as it consumes more power.",
        "Use smart plugs to schedule auto-turnoff for non-essential devices."
      ];
    } else if (q.includes("time") || q.includes("run")) {
      answer = "The best time to run heavy appliances is between 10 AM and 4 PM when grid load is usually lower or solar generation is peak.";
      tips = [
        "Avoid using high-wattage devices during peak transition (7 AM - 9 AM).",
        "Run your dishwasher or washing machine on a full load after 10 PM."
      ];
    } else {
      answer = "I'm your EcoTrack Copilot. I can analyze your energy patterns, suggest savings, and identify why your bills might be rising. Try asking 'Why is my usage high?'";
      tips = ["Use the dashboard to track real-time spikes.", "Compare your score on the leaderboard."];
    }

    res.json({
      success: true,
      answer,
      tips
    });

  } catch (error) {
    console.error('AI Copilot Error:', error);
    res.status(500).json({ success: false, message: "Copilot encountered an error." });
  }
};
