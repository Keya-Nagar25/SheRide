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
    gender: {
      type: String,
      enum: ['female'],
      default: 'female',
    },
    selfDeclaredFemale: {
      type: Boolean,
      default: false,
    },
    govIdUrl: {
      type: String,           
      default: null,
    },
    licenseUrl: {
      type: String,          
      default: null,
    },
    rcBookUrl: {
      type: String,           
      default: null,
    },
    selfieUrl: {
      type: String,           
      default: null,
    },
    vehicleType: {
      type: String,
      enum: ['auto', 'car'],  
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
    role: {
      type: String,
      default: 'driver',
    },
    isVerified: {
      type: Boolean,
      default: false,        
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: null,          
    },
    isActive: {
      type: Boolean,
      default: true,
    },
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
        type: [Number],        
        default: [0, 0],
      },
    },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    rating: { type: Number, default: 5.0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true }
);
driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

driverSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
