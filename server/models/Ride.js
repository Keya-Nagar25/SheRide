// models/Ride.js
// Every ride booked is stored here

const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    // Who is in the ride
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,          // null until a driver accepts
    },

    // Vehicle type chosen by passenger
    vehicleType: {
      type: String,
      enum: ['auto', 'car'],
      required: true,
    },

    // Locations stored as { address, lat, lng }
    pickupLocation: {
      address: String,
      lat: Number,
      lng: Number,
    },
    dropLocation: {
      address: String,
      lat: Number,
      lng: Number,
    },

    // Ride lifecycle status
    // pending    → waiting for driver
    // accepted   → driver accepted, on the way
    // started    → trip in progress
    // completed  → trip done
    // cancelled  → cancelled by passenger
    status: {
      type: String,
      enum: ['pending', 'accepted', 'started', 'completed', 'cancelled'],
      default: 'pending',
    },

    // Fare details
    estimatedFare: { type: Number, default: 0 },
    actualFare:    { type: Number, default: 0 },
    distanceKm:    { type: Number, default: 0 },
    durationMin:   { type: Number, default: 0 },

    // Payment
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'wallet'],
      default: 'cash',
    },

    // Timestamps for each stage
    acceptedAt:  { type: Date, default: null },
    startedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
