// middlewares/auth.js
// This runs BEFORE any protected route
// It checks: "Is this request coming from a logged-in, verified female user?"

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

// ---- protect: checks JWT token ----
const protect = async (req, res, next) => {
  try {
    // 1. Get token from header  →  "Bearer eyJhbGci..."
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify the token is real and not expired
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Token is invalid or expired. Please log in again.' });
    }

    // 3. Find the user (check both User and Driver collections)
    let user = await User.findById(decoded.id).select('-password -otp');
    if (!user) {
      user = await Driver.findById(decoded.id).select('-password -otp');
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    // 4. Check account is active (not suspended by admin)
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    // 5. Check user is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Your account is not yet verified.',
        verificationStatus: user.verificationStatus || 'pending',
      });
    }

    // 6. Attach user to request so routes can use it
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Auth error: ' + error.message });
  }
};

// ---- protectDocUpload: allows newly registered users to upload docs ----
// Like protect, but skips isVerified check (since docs are HOW users get verified)
const protectDocUpload = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token. Please log in.' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify the token is real and not expired
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Token is invalid or expired. Please log in again.' });
    }

    // 3. Find the user
    let user = await User.findById(decoded.id).select('-password -otp');
    if (!user) {
      user = await Driver.findById(decoded.id).select('-password -otp');
    }

    console.log('[protectDocUpload] decodedId=', decoded.id);
    console.log('[protectDocUpload] userFound=', user
      ? { id: user._id?.toString(), role: user.role, isActive: user.isActive, isVerified: user.isVerified }
      : null
    );

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    // 4. Check account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    // NOTE: isVerified check is intentionally skipped —
    // document upload IS the verification process for new drivers!

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Auth error: ' + error.message });
  }
};

// ---- restrictTo: checks role ----
// Usage: restrictTo('admin') or restrictTo('driver') or restrictTo('passenger', 'admin')
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. This route is for: ${roles.join(', ')} only.`,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo, protectDocUpload };