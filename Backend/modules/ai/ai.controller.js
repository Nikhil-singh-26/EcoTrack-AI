const EnergyReading = require('../../models/EnergyReading');
const Device = require('../../models/Device');
const { getEnergyContext, callAI } = require('../../services/aiCopilot.service');

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
    
    // 2. Gather context
    const context = await getEnergyContext(userId);

    // 3. Query AI (LLM)
    try {
      const result = await callAI(context, question);
      return res.json({
        success: true,
        answer: result.answer,
        tips: result.tips || []
      });
    } catch (llmError) {
      console.warn("LLM Failed, falling back to Rules Engine:", llmError.message);
      
      const q = question.toLowerCase();
      let answer = "";
      let tips = [];

      if (q.includes("reduce") || q.includes("lower") || q.includes("bill") || q.includes("save")) {
        answer = `Based on your usage of ${totalKwh.toFixed(2)} kWh this month, you can save approximately ${(totalKwh * 0.15).toFixed(2)} kWh by optimizing your peak usage.`;
        tips = ["Unplug standby devices.", "Switch to LEDs.", "Keep AC at 24°C."];
      } else if (q.includes("high") || q.includes("spike") || q.includes("bijli") || q.includes("usage")) {
        const highUsageDevice = devices.sort((a,b) => b.powerRating - a.powerRating)[0];
        answer = `Your ${highUsageDevice?.name || 'heavy appliances'} like AC or Water Heater are your top consumers. You currently have ${devices.filter(d => d.status === 'on').length} devices active.`;
        tips = ["Run heavy tasks in morning.", "Check for overheating.", "Use smart schedules."];
      } else {
        answer = `I am analyzing your ${devices.length} devices. Your total footprint is ${totalKwh.toFixed(2)} kWh. Try asking 'Why is my bill high?' or 'Which device uses most power?'`;
        tips = ["Use the dashboard to track spikes.", "Check your high-energy devices."];
      }

      return res.json({
        success: true,
        answer,
        tips
      });
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
