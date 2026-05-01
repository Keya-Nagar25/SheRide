const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const User = require('../models/User');
const { Rating } = require('../models/Rating');
const { protect } = require('../middlewares/auth');

router.post('/:rideId', protect, async (req, res) => {
  try {
    const { stars, comment } = req.body;
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ message: 'Stars must be between 1 and 5' });
    }

    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    if (ride.status !== 'completed') return res.status(400).json({ message: 'Can only rate completed rides' });

    let toUser, fromRole;

    if (req.user.role === 'passenger') {
      toUser = ride.driverId;
      fromRole = 'passenger';
    } else {
      toUser = ride.passengerId;
      fromRole = 'driver';
    }

    const existing = await Rating.findOne({
      rideId: ride._id,
      fromUser: req.user._id,
    });
    if (existing) return res.status(400).json({ message: 'You have already rated this ride' });

    const rating = await Rating.create({
      rideId: ride._id,
      fromUser: req.user._id,
      toUser,
      fromRole,
      stars,
      comment,
    });

    if (fromRole === 'passenger') {
      const allRatings = await Rating.find({ toUser, fromRole: 'passenger' });
      const avg = allRatings.reduce((s, r) => s + r.stars, 0) / allRatings.length;
      await Driver.findByIdAndUpdate(toUser, { rating: avg.toFixed(1), totalRatings: allRatings.length });
    } else {
      const allRatings = await Rating.find({ toUser, fromRole: 'driver' });
      const avg = allRatings.reduce((s, r) => s + r.stars, 0) / allRatings.length;
      await User.findByIdAndUpdate(toUser, { rating: avg.toFixed(1), totalRatings: allRatings.length });
    }

    res.status(201).json({ message: 'Rating submitted! Thank you 🌸', rating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
