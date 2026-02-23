const EnergyReading = require('../models/EnergyReading');
const Device = require('../models/Device');
const Alert = require('../models/Alert');

// @desc    AI Chatbot assistant
// @route   POST /api/ai/chat
// @access  Private
const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.id;

    // Get user data
    const readings = await EnergyReading.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100);

    const devices = await Device.find({ userId });

    // Calculate stats
    const totalConsumption = readings.reduce(
      (sum, r) => sum + r.consumption,
      0
    );

    const avgDaily =
      readings.length > 0
        ? (totalConsumption / Math.min(30, readings.length)) * 30
        : 0;

    const lowerMsg = message.toLowerCase();
    let response = '';

    // 🔹 Energy Saving
    if (lowerMsg.includes('save') || lowerMsg.includes('efficient')) {
      const highConsumptionDevices = devices
        .filter((d) => d.powerRating > 1000)
        .map((d) => d.name);

      if (highConsumptionDevices.length > 0) {
        response = `To save energy, reduce usage of: ${highConsumptionDevices.join(
          ', '
        )}. Try using them during off-peak hours.`;
      } else {
        response =
          'Your devices are efficient! Turn off unused appliances to save more.';
      }
    }

    // 🔹 Bill Prediction
    else if (lowerMsg.includes('bill') || lowerMsg.includes('cost')) {
      const estimatedBill = avgDaily * 0.12 * 30;
      response = `Estimated monthly bill: $${estimatedBill.toFixed(
        2
      )}. This is ${
        estimatedBill > 50 ? 'higher' : 'lower'
      } than average.`;
    }

    // 🔹 Carbon Footprint
    else if (lowerMsg.includes('carbon') || lowerMsg.includes('footprint')) {
      const carbonFootprint = totalConsumption * 0.85;
      response = `Your carbon footprint is ${carbonFootprint.toFixed(
        2
      )} kg CO2. Equivalent to driving ${(carbonFootprint / 0.4).toFixed(
        0
      )} km.`;
    }

    // 🔹 Device Status
    else if (lowerMsg.includes('device') || lowerMsg.includes('appliance')) {
      const activeDevices = devices.filter((d) => d.status === 'on');

      response = `You have ${devices.length} devices configured. `;
      response += `${activeDevices.length} currently active. `;

      if (activeDevices.length > 0) {
        response += `Active: ${activeDevices
          .map((d) => d.name)
          .join(', ')}`;
      }
    }

    // 🔹 Greeting
    else if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      response = `Hello ${req.user.name}! I'm your EcoTrack AI assistant. How can I help you today?`;
    }

    // 🔹 Default
    else {
      response =
        'I can help with energy saving tips, bill predictions, carbon footprint, and device management. Please ask something specific.';
    }

    return res.status(200).json({
      success: true,
      data: {
        message: response,
        timestamp: new Date(),
      },
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

module.exports = { chatWithAI };