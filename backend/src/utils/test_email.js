const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sendOtpEmail, sendWelcomeEmail } = require('./emailService');

async function test() {
  console.log("Testing Hostinger SMTP Live Delivery...");
  const testEmail = "noreply@quotexautotrade.com";
  
  console.log("1. Sending Test OTP Email...");
  const otpRes = await sendOtpEmail(testEmail, "984210", "Demo Trader");
  console.log("OTP Email Result:", otpRes);

  console.log("2. Sending Test Welcome Greeting Email...");
  const welcomeRes = await sendWelcomeEmail(testEmail, "Demo Trader", "Free Trial Plan");
  console.log("Welcome Email Result:", welcomeRes);
}

test().catch(console.error);
