// routes/verify.js
// Handles document uploads for drivers

const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const User = require('../models/User');
const { protect, protectDocUpload, restrictTo } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// ============================================
// POST /api/verify/upload-docs
// Driver uploads government ID + license + RC book
// Uses multer to handle 3 files at once
// Uses protectDocUpload to allow newly registered drivers
// ============================================
router.post(
  '/upload-docs',
  protectDocUpload,
  restrictTo('driver'),
  upload.fields([
    { name: 'aadhaar', maxCount: 1 },   // ← was 'govId'
    { name: 'license', maxCount: 1 },
    { name: 'selfie',  maxCount: 1 },   // ← was 'rcBook'
  ]),
  async (req, res) => {
    try {
      const driver = await Driver.findById(req.user._id);
      if (!driver) return res.status(404).json({ message: 'Driver not found' });

      if (req.files.aadhaar) driver.govIdUrl  = req.files.aadhaar[0].path;
      if (req.files.license) driver.licenseUrl = req.files.license[0].path;
      if (req.files.selfie)  driver.selfieUrl  = req.files.selfie[0].path;

      driver.verificationStatus = 'pending';
      await driver.save();

      res.json({
        message: 'Documents submitted! Admin will review within 24–48 hours.',
        uploaded: {
          aadhaar: !!req.files.aadhaar,
          license: !!req.files.license,
          selfie:  !!req.files.selfie,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ============================================
// POST /api/verify/upload-selfie
// Driver uploads selfie for face matching
// ============================================
router.post(
  '/upload-selfie',
  protectDocUpload,
  restrictTo('driver'),
  upload.single('selfie'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No selfie uploaded' });

      await Driver.findByIdAndUpdate(req.user._id, { selfieUrl: req.file.path });

      res.json({
        message: 'Selfie uploaded! Your account is now under review by our admin team.',
        selfieUrl: req.file.path,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ============================================
// POST /api/verify/upload-id  (for passengers - optional)
// ============================================
router.post(
  '/upload-id',
  protect,
  restrictTo('passenger'),
  upload.single('idProof'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

      await User.findByIdAndUpdate(req.user._id, { idProofUrl: req.file.path });

      res.json({
        message: 'ID uploaded! Your trust score has been increased.',
        idProofUrl: req.file.path,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ============================================
// GET /api/verify/status
// Check verification status (for driver dashboard)
// ============================================
router.get('/status', protectDocUpload, restrictTo('driver'), async (req, res) => {
  try {
    const driver = await Driver.findById(req.user._id).select(
      'verificationStatus isVerified govIdUrl licenseUrl rcBookUrl selfieUrl rejectionReason'
    );

    const docsUploaded = {
      govId:   !!driver.govIdUrl,
      license: !!driver.licenseUrl,
      rcBook:  !!driver.rcBookUrl,
      selfie:  !!driver.selfieUrl,
    };

    const allDocsUploaded = Object.values(docsUploaded).every(Boolean);

    res.json({
      verificationStatus: driver.verificationStatus,
      isVerified: driver.isVerified,
      docsUploaded,
      allDocsUploaded,
      rejectionReason: driver.rejectionReason,
      message: getStatusMessage(driver.verificationStatus, allDocsUploaded),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

function getStatusMessage(status, allDocs) {
  if (!allDocs) return 'Please upload all required documents to proceed.';
  if (status === 'pending') return 'Your documents are under review. This usually takes 24-48 hours.';
  if (status === 'approved') return 'You are approved! You can start accepting rides.';
  if (status === 'rejected') return 'Your application was rejected. Please check the reason and re-upload.';
  return '';
}

module.exports = router;