const mongoose = require('mongoose');

const energyReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  consumption: {
    type: Number, // in kWh
    required: true
  },
  cost: {
    type: Number, // in dollars
    required: true
  },
  carbonFootprint: {
    type: Number, // in kg CO2
    required: true
  },
  voltage: {
    type: Number,
    default: 220
  },
  current: {
    type: Number,
    default: 0
  },
  powerFactor: {
    type: Number,
    default: 0.95
  },
  source: {
    type: String,
    enum: ['real', 'simulated'],
    default: 'real'
  }
}, {
  timestamps: true
});

// Index for faster queries
energyReadingSchema.index({ userId: 1, timestamp: -1 });
energyReadingSchema.index({ deviceId: 1, timestamp: -1 });

module.exports = mongoose.model('EnergyReading', energyReadingSchema);