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
const insightsRoutes = require('./routes/insights.routes'); // New

const app = express();
const server = http.createServer(app);

// Express CORS
app.use(cors({
  origin: [process.env.CLIENT_URL, "http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));

// Socket.io CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(express.json());

// Structured logging - only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Make io accessible to routes
app.set('io', io);

// Database connection
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB');
  
  // Seed initial data if database is empty
  const seedData = require('./utils/seedData');
  seedData();
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Health Monitoring Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: "OK",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/insights', insightsRoutes); // New

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);
  
  socket.on('simulate-device', (data) => {
    // Legacy support
    io.emit('device-update', data);
    // New naming convention
    io.emit('energy:update', data);
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

app.get("/", (req, res) => {
  res.send("EcoTrack AI Backend Running 🚀");
});

module.exports = { app, server, io };
