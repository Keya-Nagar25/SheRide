const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const PendingOTP = require('../models/PendingOTP');
const { generateOTP, sendOTP, getOTPExpiry } = require('../services/otpService');

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    let user = await User.findOne({ phone });
    let driver = await Driver.findOne({ phone });

    if (user) {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
      console.log('✅ OTP saved for existing user');
    } else if (driver) {
      driver.otp = otp;
      driver.otpExpiry = otpExpiry;
      await driver.save();
      console.log('✅ OTP saved for existing driver');
    } else {
      console.log('💾 Creating PendingOTP for phone:', phone);
      const pending = await PendingOTP.findOneAndUpdate(
        { phone },
        { phone, otp, type: 'driver', expiresAt: otpExpiry },
        { upsert: true, new: true }
      );
      console.log('✅ PendingOTP saved:', pending);
    }

    await sendOTP(phone, otp);
    const response = { message: 'OTP sent successfully' };
    if (process.env.NODE_ENV !== 'production') {
      response.otp = otp; 
    }

    res.json(response);
  } catch (error) {
    console.error('❌ send-otp error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });
    let account = await User.findOne({ phone });
    let accountType = 'user';

    if (!account) {
      account = await Driver.findOne({ phone });
      accountType = 'driver';
    }

    if (!account) 
      return res.status(404).json({ message: 'Account not found. Please register first.' });
    if (account.otp !== otp) 
      return res.status(400).json({ message: 'Invalid OTP' });
    if (account.otpExpiry < Date.now()) 
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    account.otp = null;
    account.otpExpiry = null;
    await account.save();

    const token = createToken(account._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: account._id,
        name: account.name,
        phone: account.phone,
        role: account.role,
        isVerified: account.isVerified,
        verificationStatus: account.verificationStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/register/passenger', async (req, res) => {
  try {
    const { name, phone, email, otp, selfDeclaredFemale } = req.body;
    if (!name || !phone || !otp) {
      return res.status(400).json({ message: 'Name, phone, and OTP are required' });
    }
    if (!selfDeclaredFemale) {
      return res.status(400).json({ message: 'You must self-declare as female to register' });
    }

    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Phone already registered. Please login.' });
    const user = await User.create({
      name,
      phone,
      email,
      gender: 'female',
      selfDeclaredFemale: true,
      otp,
      otpExpiry: getOTPExpiry(),
      isVerified: false,
    });

    if (user.otp !== otp) {
      await User.deleteOne({ _id: user._id });
      return res.status(400).json({ message: 'Invalid OTP' });
    }
    if (user.otpExpiry < Date.now()) {
      await User.deleteOne({ _id: user._id });
      return res.status(400).json({ message: 'OTP expired' });
    }

    user.otp = null;
    user.otpExpiry = null;
    user.isVerified = true;
    await user.save();

    const token = createToken(user._id);

    res.status(201).json({
      message: 'Registration successful! Welcome to SheRide 🌸',
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/register/driver', async (req, res) => {
  try {
    const { name, phone, email, otp, selfDeclaredFemale, vehicleType, vehicleNumber, vehicleModel } = req.body;
    console.log('📋 Register driver request:', { name, phone, email, otp, selfDeclaredFemale, vehicleType, vehicleNumber, vehicleModel });

    if (!name || !phone || !otp || !vehicleType) {
      return res.status(400).json({ message: 'Name, phone, OTP, and vehicle type are required' });
    }
    if (!selfDeclaredFemale) {
      return res.status(400).json({ message: 'You must self-declare as female to register' });
    }
    if (!['auto', 'car'].includes(vehicleType)) {
      return res.status(400).json({ message: 'Vehicle type must be auto or car' });
    }

    const existing = await Driver.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Phone already registered.' });

    const pendingOTP = await PendingOTP.findOne({ phone });
    console.log('🔍 PendingOTP lookup:', { phone, found: !!pendingOTP });
    if (!pendingOTP) {
      return res.status(400).json({ message: 'Please request OTP first' });
    }
    if (pendingOTP.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }
    if (pendingOTP.expiresAt < Date.now()) {
      await PendingOTP.deleteOne({ _id: pendingOTP._id });
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }
    console.log('✏️  Creating driver...');
    const driver = await Driver.create({
      name,
      phone,
      email,
      gender: 'female',
      selfDeclaredFemale: true,
      vehicleType,
      vehicleNumber,
      vehicleModel,
      verificationStatus: 'pending',
      isVerified: false,
    });
    console.log('✅ Driver created:', driver._id);
    await PendingOTP.deleteOne({ _id: pendingOTP._id });

    const token = createToken(driver._id);

    res.status(201).json({
      message: 'Step 1 complete! Please upload your documents to complete registration.',
      token,
      driver: {
        _id: driver._id,
        name: driver.name,
        phone: driver.phone,
        role: driver.role,
        verificationStatus: driver.verificationStatus,
      },
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ message: error.message });
  }
});
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
router.post('/validate-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

    const pending = await PendingOTP.findOne({ phone });
    if (!pending) return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    if (pending.otp !== otp) return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    if (pending.expiresAt < Date.now()) {
      await PendingOTP.deleteOne({ _id: pending._id });
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    res.json({ message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
