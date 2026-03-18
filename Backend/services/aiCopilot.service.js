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

  const totalConsumption = readings.reduce((sum, r) => sum + (r.consumption || 0), 0);
  const totalCost = readings.reduce((sum, r) => sum + (r.cost || 0), 0);
  const totalCarbon = readings.reduce((sum, r) => sum + (r.carbonFootprint || 0), 0);
  
  const deviceRanking = devices.map(d => {
    const devReadings = readings.filter(r => r.deviceId?.toString() === d._id.toString());
    const devConsumption = devReadings.reduce((sum, r) => sum + (r.consumption || 0), 0);
    return {
      name: d.name,
      type: d.type,
      consumption: devConsumption, // Keep as number for sorting
      status: d.status
    };
  })
  .sort((a, b) => b.consumption - a.consumption)
  .map(d => ({
    ...d,
    consumption: d.consumption.toFixed(2) // Convert to string for the prompt
  }));

  return {
    totalConsumption: totalConsumption.toFixed(2),
    deviceCount: devices.length,
    topDevices: deviceRanking.slice(0, 5),
    carbonFootprint: totalCarbon.toFixed(2),
    estimatedCost: totalCost.toFixed(2)
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
    - Total Cost: $${context.estimatedCost}
    - Carbon Footprint: ${context.carbonFootprint} kg CO2
    - Device Insights (Top 5): ${JSON.stringify(context.topDevices)}
    
    User Question: "${question}"
    
    Respond in a professional, helpful, and concise manner. Provide data-driven insights based on the context above.
    
    Return ONLY a JSON object with this structure:
    {
      "answer": "Your detailed answer goes here",
      "tips": ["tip 1", "tip 2"]
    }
    `;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: config.aiModel,
        messages: [
          { role: 'system', content: 'You are a helpful energy assistant. Always respond with valid JSON containing "answer" and "tips" fields.' },
          { role: 'user', content: prompt }
        ],
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

    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      throw new Error('Empty response from AI service');
    }

    const content = response.data.choices[0].message.content;
    
    // Robust parsing: strip markdown code blocks if present
    const cleanContent = content.replace(/```json\n?|```/g, '').trim();
    
    try {
      return JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return {
        answer: content, // Fallback if it's not JSON but has content
        tips: ["Check your high-energy devices first", "Monitor real-time usage for spikes"]
      };
    }

  } catch (error) {
    console.error('AI Copilot Service Error:', error.response?.data || error.message);
    throw new Error('AI Copilot is currently unavailable. Please try again later.');
  }
};

module.exports = { getEnergyContext, callAI };
