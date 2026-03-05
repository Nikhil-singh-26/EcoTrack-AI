exports.detectAnomaly = async (req, res) => {
  try {

    const { usage } = req.body;

    if (!usage) {
      return res.status(400).json({ error: "Usage value required" });
    }

    const averageUsage = 5;

    if (usage > averageUsage * 2) {
      return res.json({
        anomaly: true,
        message: "Abnormal energy spike detected ⚠️"
      });
    }

    res.json({
      anomaly: false,
      message: "Energy usage normal"
    });

  } catch (error) {
    res.status(500).json({
      error: "Anomaly detection failed"
    });
  }
};
