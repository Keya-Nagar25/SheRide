const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    passengerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null,          
    },
    vehicleType: {
      type: String,
      enum: ['auto', 'car'],
      required: true,
    },
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
    status: {
      type: String,
      enum: ['pending', 'accepted', 'started', 'completed', 'cancelled'],
      default: 'pending',
    },
    estimatedFare: { type: Number, default: 0 },
    actualFare:    { type: Number, default: 0 },
    distanceKm:    { type: Number, default: 0 },
    durationMin:   { type: Number, default: 0 },
    
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
    acceptedAt:  { type: Date, default: null },
    startedAt:   { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ride', rideSchema);
