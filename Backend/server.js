const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const deviceRoutes = require('./routes/device.routes');
const energyRoutes = require('./routes/energy.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? 'https://yourdomain.com' 
      : 'http://localhost:3000',
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Make io accessible to routes
app.set('io', io);

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Seed initial data if database is empty
  const seedData = require('./utils/seedData');
  seedData();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/admin', adminRoutes);

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('simulate-device', (data) => {
    // Handle device simulation
    io.emit('device-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = { app, server, io };

app.get("/", (req, res) => {
  res.send("EcoTrack AI Backend Running 🚀");
});
