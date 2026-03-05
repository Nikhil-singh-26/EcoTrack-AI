const { generateEnergyInsights } = require('../utils/energyInsights');
const { generateAIReport } = require('../services/aiInsights.service');

// @desc    Get AI Energy Insights (Local Rule-based)
// @route   GET /api/insights
// @access  Private
const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const insights = await generateEnergyInsights(userId);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Insights Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get Detailed AI Report (LLM-based)
// @route   GET /api/insights/ai-report
// @access  Private
const getAIReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const report = await generateAIReport(userId);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('AI Report Error:', error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.error?.message || 'Failed to generate AI report' 
    });
  }
};

module.exports = { getInsights, getAIReport };
