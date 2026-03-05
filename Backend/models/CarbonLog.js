const mongoose = require('mongoose');

const CarbonLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  energyUsage: {
    type: Number,
    required: true
  },
  carbonEmission: {
    type: Number,
    required: true
  },
  environmentalImpact: {
    type: String,
    enum: ['Low', 'Moderate', 'High'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CarbonLog', CarbonLogSchema);
