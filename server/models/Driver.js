// models/Driver.js
// This represents a DRIVER in the database

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 6,
    },

    // ---- Female verification fields (STRICT) ----
    gender: {
      type: String,
      enum: ['female'],
      default: 'female',
    },
    selfDeclaredFemale: {
      type: Boolean,
      default: false,
    },

    // ---- Document uploads (required for driver approval) ----
    govIdUrl: {
      type: String,           // Aadhar / PAN card
      default: null,
    },
    licenseUrl: {
      type: String,           // Driving license
      default: null,
    },
    rcBookUrl: {
      type: String,           // Vehicle registration certificate
      default: null,
    },
    selfieUrl: {
      type: String,           // Selfie for face matching
      default: null,
    },

    // ---- Vehicle details ----
    vehicleType: {
      type: String,
      enum: ['auto', 'car'],  // Either auto-rickshaw or car
      required: true,
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    vehicleModel: {
      type: String,
      trim: true,
    },

    // ---- Account status ----
    role: {
      type: String,
      default: 'driver',
    },
    isVerified: {
      type: Boolean,
      default: false,         // Stays false until admin approves
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,          // Admin fills this if rejected
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // ---- Live location (updated every 3 seconds when online) ----
    isOnline: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],        // [longitude, latitude]
        default: [0, 0],
      },
    },

    // ---- OTP ----
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },

    // ---- Ratings ----
    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// 2dsphere index enables location-based queries (find nearby drivers)
driverSchema.index({ currentLocation: '2dsphere' });

// Hash password before saving
driverSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

driverSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
