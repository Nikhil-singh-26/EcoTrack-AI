const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide device name']
  },
  type: {
    type: String,
    enum: ['ac', 'fan', 'refrigerator', 'tv', 'light', 'washer', 'oven', 'other'],
    required: true
  },
  powerRating: {
    type: Number, // in watts
    required: [true, 'Please provide power rating']
  },
  status: {
    type: String,
    enum: ['on', 'off', 'standby'],
    default: 'off'
  },
  room: {
    type: String,
    default: 'Living Room'
  },
  isSmart: {
    type: Boolean,
    default: false
  },
  dailyUsage: [{
    date: {
      type: Date,
      default: Date.now
    },
    hoursUsed: Number,
    energyConsumed: Number // in kWh
  }],
  alerts: [{
    message: String,
    threshold: Number,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate energy consumption
deviceSchema.methods.calculateEnergy = function(hours) {
  return (this.powerRating * hours) / 1000; // kWh
};

module.exports = mongoose.model('Device', deviceSchema);