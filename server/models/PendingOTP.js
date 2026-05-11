const mongoose = require('mongoose');

const pendingOTPSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['user', 'driver'],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, 
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PendingOTP', pendingOTPSchema);
