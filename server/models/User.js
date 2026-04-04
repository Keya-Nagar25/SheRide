// models/User.js
// This represents a PASSENGER in the database

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
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
    // ---- Female verification fields ----
    gender: {
      type: String,
      enum: ['female'],       // Only 'female' is allowed!
      default: 'female',
    },
    selfDeclaredFemale: {
      type: Boolean,
      default: false,         // Must check the box during registration
    },
    idProofUrl: {
      type: String,           // Cloudinary URL for optional ID upload
      default: null,
    },

    // ---- Account status ----
    role: {
      type: String,
      enum: ['passenger', 'admin'],
      default: 'passenger',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,          // Admin can set to false to suspend
    },

    // ---- OTP fields ----
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },

    // ---- Emergency contacts for SOS ----
    emergencyContacts: [
      {
        name: String,
        phone: String,
      },
    ],

    // ---- Ratings received as a passenger ----
    rating: {
      type: Number,
      default: 5.0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }   // Adds createdAt and updatedAt automatically
);

// Hash password before saving (if password exists)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords during login
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
