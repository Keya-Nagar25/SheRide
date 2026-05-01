
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const User = require('../models/User');
const { protect, restrictTo } = require('../middlewares/auth');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
router.post('/trigger', protect, restrictTo('passenger'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.emergencyContacts || user.emergencyContacts.length === 0) {
      return res.status(400).json({
        message: 'No emergency contacts found. Please add them in your profile.',
      });
    }

    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const message = `🚨 SOS ALERT from ${user.name}!\nShe may need help.\nLast known location: ${mapsLink}\nThis is an automated message from SheRide.`;
    if (process.env.NODE_ENV !== 'production') {
      console.log('SOS MESSAGE:', message);
      console.log('Would send to:', user.emergencyContacts);
      return res.json({ message: 'SOS triggered (dev mode - SMS not sent)', contacts: user.emergencyContacts.length });
    }

    const sends = user.emergencyContacts.map((contact) =>
      client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: contact.phone,
      })
    );
    await Promise.all(sends);

    res.json({
      message: `SOS sent to ${user.emergencyContacts.length} contact(s)`,
      contacts: user.emergencyContacts.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put('/contacts', protect, restrictTo('passenger'), async (req, res) => {
  try {
    const { contacts } = req.body;
    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ message: 'Contacts must be an array' });
    }
    if (contacts.length > 3) {
      return res.status(400).json({ message: 'Maximum 3 emergency contacts allowed' });
    }

    await User.findByIdAndUpdate(req.user._id, { emergencyContacts: contacts });
    res.json({ message: 'Emergency contacts updated', contacts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
