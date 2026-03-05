const CarbonLog = require('../../models/CarbonLog');

/**
 * @desc    Calculate Carbon Impact and Log it
 * @route   POST /api/energy/carbon-impact
 * @access  Private
 */
exports.calculateCarbonImpact = async (req, res) => {
  try {
    const { energyUsage } = req.body;
    const userId = req.user ? req.user.id : null;

    if (energyUsage === undefined || energyUsage === null) {
      return res.status(400).json({ error: "energyUsage value required (kWh)" });
    }

    // CO2 per kWh = 0.82 kg (India average as per requirement)
    const CO2_FACTOR = 0.82;
    const carbonEmission = energyUsage * CO2_FACTOR;

    // Tree calculation: 1 tree absorbs ≈ 21 kg CO2 per year
    const treesRequiredToOffset = carbonEmission / 21;

    // Environmental Impact logic
    let environmentalImpact = "Low";
    if (carbonEmission > 10) {
      environmentalImpact = "High";
    } else if (carbonEmission > 4) {
      environmentalImpact = "Moderate";
    }

    // Save to MongoDB if userId is available
    if (userId) {
      await CarbonLog.create({
        userId,
        energyUsage,
        carbonEmission,
        environmentalImpact
      });
    }

    res.json({
      energyUsage,
      carbonEmission: Number(carbonEmission.toFixed(2)),
      treesRequiredToOffset: Math.ceil(treesRequiredToOffset),
      environmentalImpact
    });

  } catch (error) {
    console.error('Carbon Impact Error:', error.message);
    res.status(500).json({
      error: "Carbon impact calculation failed"
    });
  }
};
