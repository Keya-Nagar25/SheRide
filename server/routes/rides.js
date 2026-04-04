// routes/rides.js
// All ride-related endpoints

const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const { Earning } = require('../models/Rating');
const { protect, restrictTo } = require('../middlewares/auth');
const { calcFare, getFareEstimates } = require('../services/fareService');

// ============================================
// POST /api/rides/estimate
// Get fare estimate before booking
// Body: { pickupLat, pickupLng, dropLat, dropLng }
// ============================================
router.post('/estimate', protect, restrictTo('passenger'), async (req, res) => {
  try {
    const { pickupLat, pickupLng, dropLat, dropLng } = req.body;

    // Simple distance calc using Haversine formula
    const distanceKm = getDistanceKm(pickupLat, pickupLng, dropLat, dropLng);
    const durationMin = Math.round(distanceKm * 2.5); // Rough estimate: 2.5 min per km

    const estimates = getFareEstimates(distanceKm, durationMin);

    res.json({
      distanceKm: distanceKm.toFixed(2),
      durationMin,
      estimates, // { auto: 120, car: 220 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET /api/rides/nearby-drivers
// Find female drivers near the passenger's location
// Query: ?lat=12.97&lng=77.59&vehicleType=auto&radius=5
// ============================================
router.get('/nearby-drivers', protect, restrictTo('passenger'), async (req, res) => {
  try {
    const { lat, lng, vehicleType, radius = 5 } = req.query;

    if (!lat || !lng) return res.status(400).json({ message: 'lat and lng are required' });

    const drivers = await Driver.find({
      isOnline: true,
      isVerified: true,
      isActive: true,
      ...(vehicleType && { vehicleType }),
      currentLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000, // Convert km to metres
        },
      },
    }).select('name vehicleType vehicleNumber vehicleModel rating currentLocation');

    res.json({ drivers, count: drivers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// POST /api/rides/book
// Book a ride
// ============================================
router.post('/book', protect, restrictTo('passenger'), async (req, res) => {
  try {
    const {
      vehicleType,
      pickupAddress, pickupLat, pickupLng,
      dropAddress, dropLat, dropLng,
      paymentMethod = 'cash',
    } = req.body;

    if (!vehicleType || !pickupLat || !pickupLng || !dropLat || !dropLng) {
      return res.status(400).json({ message: 'Vehicle type and locations are required' });
    }

    const distanceKm = getDistanceKm(pickupLat, pickupLng, dropLat, dropLng);
    const durationMin = Math.round(distanceKm * 2.5);
    const estimatedFare = calcFare(vehicleType, distanceKm, durationMin);

    const ride = await Ride.create({
      passengerId: req.user._id,
      vehicleType,
      pickupLocation: { address: pickupAddress, lat: pickupLat, lng: pickupLng },
      dropLocation: { address: dropAddress, lat: dropLat, lng: dropLng },
      estimatedFare,
      distanceKm,
      durationMin,
      paymentMethod,
      status: 'pending',
    });

    // Populate for response
    await ride.populate('passengerId', 'name phone rating');

    res.status(201).json({
      message: 'Ride requested! Looking for a nearby driver...',
      ride,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// PUT /api/rides/:id/cancel
// Passenger cancels a pending ride
// ============================================
router.put('/:id/cancel', protect, restrictTo('passenger'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    if (ride.passengerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your ride' });
    }
    if (!['pending', 'accepted'].includes(ride.status)) {
      return res.status(400).json({ message: 'Cannot cancel a ride that has already started' });
    }

    ride.status = 'cancelled';
    ride.cancelledAt = new Date();
    await ride.save();

    res.json({ message: 'Ride cancelled', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// PUT /api/rides/:id/accept
// Driver accepts a ride
// ============================================
router.put('/:id/accept', protect, restrictTo('driver'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'pending') return res.status(400).json({ message: 'Ride is no longer available' });

    ride.driverId = req.user._id;
    ride.status = 'accepted';
    ride.acceptedAt = new Date();
    await ride.save();
    await ride.populate('passengerId', 'name phone rating');
    await ride.populate('driverId', 'name phone vehicleNumber vehicleModel rating');

    res.json({ message: 'Ride accepted!', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// PUT /api/rides/:id/start
// Driver starts the trip (passenger has been picked up)
// ============================================
router.put('/:id/start', protect, restrictTo('driver'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'accepted') return res.status(400).json({ message: 'Ride must be accepted first' });
    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your ride' });
    }

    ride.status = 'started';
    ride.startedAt = new Date();
    await ride.save();

    res.json({ message: 'Trip started!', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// PUT /api/rides/:id/complete
// Driver completes the trip
// ============================================
router.put('/:id/complete', protect, restrictTo('driver'), async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'started') return res.status(400).json({ message: 'Trip must be started first' });
    if (ride.driverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not your ride' });
    }

    ride.status = 'completed';
    ride.completedAt = new Date();
    ride.actualFare = ride.estimatedFare;
    ride.paymentStatus = 'paid';
    await ride.save();

    // Record earnings for driver
    await Earning.create({
      driverId: ride.driverId,
      rideId: ride._id,
      amount: ride.actualFare,
    });

    res.json({ message: 'Trip completed! Great job 🌸', ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET /api/rides/history
// Get past rides for passenger or driver
// ============================================
router.get('/history', protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'passenger') {
      query.passengerId = req.user._id;
    } else if (req.user.role === 'driver') {
      query.driverId = req.user._id;
    }

    const rides = await Ride.find(query)
      .populate('passengerId', 'name phone')
      .populate('driverId', 'name phone vehicleNumber')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ rides });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================================
// GET /api/rides/:id
// Get single ride details
// ============================================
router.get('/:id', protect, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('passengerId', 'name phone rating')
      .populate('driverId', 'name phone vehicleNumber vehicleModel rating');

    if (!ride) return res.status(404).json({ message: 'Ride not found' });

    res.json({ ride });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---- Helper: Haversine formula to get distance in km ----
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function toRad(deg) { return (deg * Math.PI) / 180; }

module.exports = router;
