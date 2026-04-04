// routes/admin.js
// Admin-only routes for managing the platform

const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const User = require('../models/User');
const Ride = require('../models/Ride');
const { Earning } = require('../models/Rating');
const { protect, restrictTo } = require('../middlewares/auth');

// All admin routes require login + admin role
router.use(protect, restrictTo('admin'));

// ============================================
// GET /api/admin/drivers/pending
// Get all drivers waiting for approval
// ============================================
router.get('/drivers/pending', async (req, res) => {
  try {
    const drivers = await Driver.find({ verificationStatus: 'pending' })
      .select('-password -otp')
      .sort({ createdAt: 1 }); // Oldest first (FIFO queue)

    res.json({ drivers, count: drivers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET /api/admin/drivers
// Get all drivers with optional status filter
// Query: ?status=approved&page=1
// ============================================
router.get('/drivers', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { verificationStatus: status } : {};
    const drivers = await Driver.find(filter)
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await Driver.countDocuments(filter);
    res.json({ drivers, total, page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// POST /api/admin/verify/:driverId/approve
// Approve a driver
// ============================================
router.post('/verify/:driverId/approve', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    driver.verificationStatus = 'approved';
    driver.isVerified = true;
    driver.rejectionReason = null;
    await driver.save();

    // TODO: Send approval SMS/notification to driver

    res.json({ message: `Driver ${driver.name} has been approved! 🌸`, driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// POST /api/admin/verify/:driverId/reject
// Reject a driver with a reason
// Body: { reason }
// ============================================
router.post('/verify/:driverId/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Please provide a rejection reason' });

    const driver = await Driver.findById(req.params.driverId);
    if (!driver) return res.status(404).json({ message: 'Driver not found' });

    driver.verificationStatus = 'rejected';
    driver.isVerified = false;
    driver.rejectionReason = reason;
    await driver.save();

    res.json({ message: `Driver ${driver.name} has been rejected.`, driver });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET /api/admin/users
// All passengers
// ============================================
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await User.find({ role: 'passenger' })
      .select('-password -otp')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await User.countDocuments({ role: 'passenger' });
    res.json({ users, total, page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// PUT /api/admin/users/:id/suspend
// Suspend a user (passenger or driver)
// Body: { type: 'user' | 'driver' }
// ============================================
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const { type = 'user' } = req.body;
    const Model = type === 'driver' ? Driver : User;

    const account = await Model.findById(req.params.id);
    if (!account) return res.status(404).json({ message: 'Account not found' });

    account.isActive = !account.isActive;
    await account.save();

    res.json({
      message: account.isActive
        ? `Account reactivated for ${account.name}`
        : `Account suspended for ${account.name}`,
      isActive: account.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET /api/admin/rides
// All rides with filters
// ============================================
router.get('/rides', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = status ? { status } : {};

    const rides = await Ride.find(filter)
      .populate('passengerId', 'name phone')
      .populate('driverId', 'name phone vehicleType')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Ride.countDocuments(filter);
    res.json({ rides, total, page });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET /api/admin/reports
// Summary stats for the dashboard
// ============================================
router.get('/reports', async (req, res) => {
  try {
    const [
      totalUsers,
      totalDrivers,
      approvedDrivers,
      pendingDrivers,
      totalRides,
      completedRides,
      earnings,
    ] = await Promise.all([
      User.countDocuments({ role: 'passenger' }),
      Driver.countDocuments(),
      Driver.countDocuments({ verificationStatus: 'approved' }),
      Driver.countDocuments({ verificationStatus: 'pending' }),
      Ride.countDocuments(),
      Ride.countDocuments({ status: 'completed' }),
      Earning.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    ]);

    res.json({
      users:          { total: totalUsers },
      drivers:        { total: totalDrivers, approved: approvedDrivers, pending: pendingDrivers },
      rides:          { total: totalRides, completed: completedRides },
      totalRevenue:   earnings[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
