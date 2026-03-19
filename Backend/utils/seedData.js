const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Device = require('../models/Device');
const EnergyReading = require('../models/EnergyReading');
const Alert = require('../models/Alert');

const seedData = async () => {
  try {
    const userCount = await User.countDocuments();
    // Update existing users if they have mock names
    const mockUsersMap = {
      'John Doe': 'Raj Jaiswal',
      'Jane Smith': 'Rahul Dewangan',
      'Bob Johnson': 'Roshan Verma',
      'Admin User': 'Admin'
    };

    if (userCount > 0) {
      console.log('🔄 Checking for mock users to rename...');
      for (const [oldName, newName] of Object.entries(mockUsersMap)) {
        await User.updateOne({ name: oldName }, { name: newName });
      }
      console.log('✅ Name update complete.');
      return;
    }

    console.log('🌱 Seeding database with initial data...');

    // Create users
    const users = await User.create([
      {
        name: 'Raj Jaiswal',
        email: 'raj@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        location: 'Raipur',
        energyGoal: 500,
        carbonSaved: 120,
        totalEnergySaved: 350,
        rank: 1
      },
      {
        name: 'Rahul Dewangan',
        email: 'rahul@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        location: 'Raipur',
        energyGoal: 450,
        carbonSaved: 95,
        totalEnergySaved: 280,
        rank: 2
      },
      {
        name: 'Roshan Verma',
        email: 'roshan@example.com',
        password: await bcrypt.hash('password123', 10),
        role: 'user',
        location: 'Raipur',
        energyGoal: 600,
        carbonSaved: 80,
        totalEnergySaved: 210,
        rank: 3
      },
      {
        name: 'Admin',
        email: 'admin@ecotrack.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        location: 'Headquarters',
        energyGoal: 400,
        carbonSaved: 200,
        totalEnergySaved: 500,
        rank: 0
      }
    ]);

    console.log(`✅ Created ${users.length} users`);

    // Create devices for each user
    const deviceTypes = ['ac', 'fan', 'refrigerator', 'tv', 'light', 'washer', 'oven'];
    const rooms = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Garage', 'Office'];
    const devices = [];

    for (const user of users) {
      // Each user gets 3-6 devices
      const numDevices = Math.floor(Math.random() * 4) + 3; // 3 to 6
      for (let i = 0; i < numDevices; i++) {
        const type = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
        const powerRating = (Math.floor(Math.random() * 20) + 5) * 100; // 500W to 2500W
        const status = Math.random() > 0.5 ? 'on' : 'off';
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const isSmart = Math.random() > 0.7;

        const device = await Device.create({
          userId: user._id,
          name: `${room} ${type.toUpperCase()}`,
          type,
          powerRating,
          status,
          room,
          isSmart
        });
        devices.push(device);
      }
    }

    console.log(`✅ Created ${devices.length} devices`);

    // Generate energy readings for the last 30 days
    const readings = [];
    const now = new Date();
    const co2Factor = parseFloat(process.env.CO2_FACTOR) || 0.85;
    const ratePerKwh = 0.12; // $ per kWh

    for (const device of devices) {
      // For each device, generate 30 days of readings
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

        // Simulate consumption: if device is on, generate consumption based on hours used
        const hoursUsed = Math.random() * (device.status === 'on' ? 8 : 2); // 0-8 hours if on, 0-2 if off
        const consumption = (device.powerRating * hoursUsed) / 1000; // kWh
        const cost = consumption * ratePerKwh;
        const carbonFootprint = consumption * co2Factor;

        const reading = {
          userId: device.userId,
          deviceId: device._id,
          timestamp: date,
          consumption,
          cost,
          carbonFootprint,
          voltage: 220 + (Math.random() * 10 - 5),
          current: (device.powerRating / 220) * (Math.random() * 0.2 + 0.9),
          source: 'simulated'
        };
        readings.push(reading);
      }
    }

    await EnergyReading.insertMany(readings);
    console.log(`✅ Created ${readings.length} energy readings`);

    // Create some alerts
    const alerts = [];
    for (const user of users) {
      // Skip admin for alerts
      if (user.role === 'admin') continue;

      const userDevices = devices.filter(d => d.userId.toString() === user._id.toString());
      for (const device of userDevices.slice(0, 2)) { // Create alerts for up to 2 devices per user
        const alertTypes = ['high-usage', 'abnormal-pattern', 'bill-forecast', 'achievement', 'tip'];
        const severities = ['info', 'warning', 'critical'];

        const alert = {
          userId: user._id,
          deviceId: device._id,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          title: 'Sample Alert',
          message: `This is a sample alert for ${device.name}.`,
          value: Math.random() * 10,
          threshold: 8,
          read: Math.random() > 0.7
        };
        alerts.push(alert);
      }
    }

    await Alert.insertMany(alerts);
    console.log(`✅ Created ${alerts.length} alerts`);

    console.log('🌱 Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};

module.exports = seedData;