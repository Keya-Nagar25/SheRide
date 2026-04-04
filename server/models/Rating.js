// models/Rating.js
const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    rideId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    fromUser: { type: mongoose.Schema.Types.ObjectId, required: true },   // who gave the rating
    toUser:   { type: mongoose.Schema.Types.ObjectId, required: true },   // who received it
    fromRole: { type: String, enum: ['passenger', 'driver'] },
    stars:    { type: Number, min: 1, max: 5, required: true },
    comment:  { type: String, default: '' },
  },
  { timestamps: true }
);

const Rating = mongoose.model('Rating', ratingSchema);

// ============================================

// models/Earning.js
const earningSchema = new mongoose.Schema(
  {
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
    rideId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true },
    amount:   { type: Number, required: true },
    date:     { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Earning = mongoose.model('Earning', earningSchema);

module.exports = { Rating, Earning };
