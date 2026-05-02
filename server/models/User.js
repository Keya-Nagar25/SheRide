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
    gender: {
      type: String,
      enum: ['female'],       
      default: 'female',
    },
    selfDeclaredFemale: {
      type: Boolean,
      default: false,         
    },
    idProofUrl: {
      type: String,          
      default: null,
    },
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
      default: true,         
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
    emergencyContacts: [
      {
        name: String,
        phone: String,
      },
    ],
    rating: {
      type: Number,
      default: 5.0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }   
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
