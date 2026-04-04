// models/PendingOTP.js
// Temporary storage for OTPs during new user/driver registration
// Auto-deletes after 10 minutes

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
      index: { expires: 0 }, // Auto-delete after this timestamp
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PendingOTP', pendingOTPSchema);
