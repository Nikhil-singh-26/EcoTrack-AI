const { getEnergyContext, callAI } = require('../services/aiCopilot.service');

/**
 * @desc    Ask the AI Energy Copilot a question
 * @route   POST /api/ai/copilot
 * @access  Private
 */
const askEnergyCopilot = async (req, res) => {
  try {
    const { question } = req.body;
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({ success: false, message: 'Please provide a question' });
    }

    // 1. Gather context
    const context = await getEnergyContext(userId);

    // 2. Query AI
    const result = await callAI(context, question);

    res.json({
      success: true,
      answer: result.answer,
      tips: result.tips || []
    });

  } catch (error) {
    console.error('AI Copilot Controller Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal Server Error'
    });
  }
};

module.exports = { askEnergyCopilot };