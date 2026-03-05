const axios = require('axios');
const config = require('../config/env');
const EnergyReading = require('../models/EnergyReading');
const Device = require('../models/Device');

/**
 * Prepares energy context for the AI Copilot
 */
const getEnergyContext = async (userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [devices, readings] = await Promise.all([
    Device.find({ userId }),
    EnergyReading.find({ userId, timestamp: { $gte: thirtyDaysAgo } }).sort({ timestamp: -1 })
  ]);

  const totalConsumption = readings.reduce((sum, r) => sum + r.consumption, 0);
  
  const deviceRanking = devices.map(d => {
    const devReadings = readings.filter(r => r.deviceId?.toString() === d._id.toString());
    const devConsumption = devReadings.reduce((sum, r) => sum + r.consumption, 0);
    return {
      name: d.name,
      type: d.type,
      consumption: devConsumption.toFixed(2),
      status: d.status
    };
  }).sort((a, b) => b.consumption - a.consumption);

  return {
    totalConsumption: totalConsumption.toFixed(2),
    deviceCount: devices.length,
    topDevices: deviceRanking.slice(0, 5),
    carbonFootprint: (totalConsumption * config.co2Factor).toFixed(2),
    estimatedCost: (totalConsumption * config.electricityRate).toFixed(2)
  };
};

/**
 * Communicates with OpenRouter AI
 */
const callAI = async (context, question) => {
  try {
    const prompt = `
    You are the "EcoTrack AI Energy Copilot", a specialized assistant for home energy management.
    
    User context for the last 30 days:
    - Total Consumption: ${context.totalConsumption} kWh
    - Estimated Cost: $${context.estimatedCost}
    - Carbon Footprint: ${context.carbonFootprint} kg CO2
    - Device Insights: ${JSON.stringify(context.topDevices)}
    
    User Question: "${question}"
    
    Respond in a professional, helpful, and concise manner. 
    Return ONLY a JSON object with this structure:
    {
      "answer": "Clear text answer with specific data-driven insights",
      "tips": ["actionable tip 1", "actionable tip 2"]
    }
    `;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: config.aiModel,
        messages: [{ role: 'system', content: 'Return valid JSON.' }, { role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouterApiKey}`,
          'HTTP-Referer': config.clientUrl,
          'X-Title': 'EcoTrack AI Copilot'
        },
        timeout: 25000
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error('AI Copilot Service Error:', error.message);
    throw new Error('AI Copilot is currently unavailable. Please try again later.');
  }
};

module.exports = { getEnergyContext, callAI };
