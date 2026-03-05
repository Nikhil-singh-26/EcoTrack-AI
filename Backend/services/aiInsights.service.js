const axios = require('axios');
const config = require('../config/env');
const EnergyReading = require('../models/EnergyReading');
const Device = require('../models/Device');

/**
 * Generate a detailed AI Energy Report using LLM
 */
const generateAIReport = async (userId) => {
  try {
    if (!config.aiInsightsEnabled) {
      throw new Error('AI Insights are disabled via environment configuration.');
    }

    // 1. Gather User's Energy Context
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [devices, readings] = await Promise.all([
      Device.find({ userId }),
      EnergyReading.find({ userId, timestamp: { $gte: thirtyDaysAgo } }).sort({ timestamp: -1 })
    ]);

    if (readings.length === 0) {
      return {
        message: "Insufficient data to generate an AI report. Please ensure your devices are active.",
        status: "no_data"
      };
    }

    // Calculate basic stats for the prompt
    const totalConsumption = readings.reduce((sum, r) => sum + r.consumption, 0);
    const totalCost = readings.reduce((sum, r) => sum + r.cost, 0);
    const totalCarbon = readings.reduce((sum, r) => sum + r.carbonFootprint, 0);

    const deviceBreakdown = devices.map(d => {
      const devReadings = readings.filter(r => r.deviceId?.toString() === d._id.toString());
      const devConsumption = devReadings.reduce((sum, r) => sum + r.consumption, 0);
      return {
        name: d.name,
        type: d.type,
        powerRating: d.powerRating,
        consumption: devConsumption.toFixed(2),
        percentage: totalConsumption > 0 ? ((devConsumption / totalConsumption) * 100).toFixed(1) : 0
      };
    });

    // 2. Prepare Prompt for LLM
    const prompt = `
    You are an expert energy efficiency auditor. Analyze this user's energy consumption for the last 30 days and provide a structured JSON report.
    
    Data:
    - Total Consumption: ${totalConsumption.toFixed(2)} kWh
    - Total Cost: $${totalCost.toFixed(2)} (at $${config.electricityRate}/kWh)
    - Total Carbon Footprint: ${totalCarbon.toFixed(2)} kg CO2
    - Devices: ${JSON.stringify(deviceBreakdown)}
    
    Requirement:
    Return ONLY a JSON object with this exact structure:
    {
      "consumptionAnalysis": "detailed string analyzing overall trends",
      "deviceEfficiencyReport": [
        {"device": "name", "efficiency": "score out of 100", "recommendation": "text"}
      ],
      "predictedBillImprovement": {
        "withChanges": "estimated cost",
        "savings": "estimated savings string"
      },
      "carbonReductionTips": ["tip 1", "tip 2", "tip 3"]
    }
    `;

    // 3. Call OpenRouter AI
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: config.aiModel,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.openRouterApiKey}`,
          'HTTP-Referer': config.clientUrl,
          'X-Title': 'EcoTrack AI'
        },
        timeout: 30000 // 30s timeout for AI response
      }
    );

    const result = JSON.parse(response.data.choices[0].message.content);
    return result;

  } catch (error) {
    console.error('AI Service Error:', error.message);
    throw error;
  }
};

module.exports = { generateAIReport };
