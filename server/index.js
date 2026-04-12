// ============================================
//   SheRide - Main Server File
//   This is where EVERYTHING starts
// ============================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import all route files
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const driverRoutes = require('./routes/driver');
const verifyRoutes = require('./routes/verify');
const adminRoutes = require('./routes/admin');
const ratingsRoutes = require('./routes/ratings');
const sosRoutes = require('./routes/sos');

// Import socket handler
const initSocket = require('./sockets');

const app = express();
const server = http.createServer(app);

// ---- Allowed frontend origins (run 2 clients for passenger + driver) ----
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
];

// ---- Socket.io setup ----
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
});

// ---- Middleware ----
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Routes ----
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/sos', sosRoutes);

// ---- Health check ----
app.get('/', (req, res) => {
  res.json({ message: '🌸 SheRide API is running!' });
});

// ---- Error handler (catches all errors) ----
app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// ---- Socket.io events ----
initSocket(io);

// ---- Connect to MongoDB then start server ----
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected!');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
