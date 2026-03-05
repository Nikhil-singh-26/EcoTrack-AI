const { generateEnergyInsights } = require('../utils/energyInsights');

// @desc    Get AI Energy Insights
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

module.exports = { getInsights };
