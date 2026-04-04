// routes/driver.js
// Driver-specific actions after they are approved

const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { Earning } = require('../models/Rating');
const { protect, restrictTo } = require('../middlewares/auth');

// ============================================
// PUT /api/driver/toggle-online
// Driver goes online or offline
// ============================================
router.put('/toggle-online', protect, restrictTo('driver'), async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id);
    driver.isOnline = !driver.isOnline;
    await driver.save();

    res.json({
      message: driver.isOnline ? 'You are now ONLINE 🟢' : 'You are now OFFLINE 🔴',
      isOnline: driver.isOnline,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// PUT /api/driver/location
// Update driver's GPS coordinates
// Body: { lat, lng }
// ============================================
router.put('/location', protect, restrictTo('driver'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng required' });

    await Driver.findByIdAndUpdate(req.user._id, {
      currentLocation: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)], // MongoDB uses [lng, lat]
      },
    });

    res.json({ message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET /api/driver/earnings
// Driver's earnings dashboard
// ============================================
router.get('/earnings', protect, restrictTo('driver'), async (req, res) => {
  try {
    const driverId = req.user._id;
    const earnings = await Earning.find({ driverId })
      .populate('rideId', 'pickupLocation dropLocation distanceKm createdAt')
      .sort({ createdAt: -1 });

    const total = earnings.reduce((sum, e) => sum + e.amount, 0);

    // Today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEarnings = earnings
      .filter((e) => new Date(e.createdAt) >= today)
      .reduce((sum, e) => sum + e.amount, 0);

    res.json({
      total,
      today: todayEarnings,
      count: earnings.length,
      earnings,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET /api/driver/profile
// Driver's own profile
// ============================================
router.get('/profile', protect, restrictTo('driver'), async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id).select('-password -otp -otpExpiry');
    res.json({ driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
