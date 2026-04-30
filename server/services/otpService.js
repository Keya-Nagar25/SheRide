const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phone, otp) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📱 OTP for ${phone}: ${otp}`);
    return { success: true };
  }

  await client.messages.create({
    body: `Your SheRide verification code is: ${otp}. Valid for 10 minutes. Do not share this with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  return { success: true };
};

const getOTPExpiry = () => {
  return new Date(Date.now() + 10 * 60 * 1000);
};

module.exports = { generateOTP, sendOTP, getOTPExpiry };
