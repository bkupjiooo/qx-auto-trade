const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false'; // true for 465
const SMTP_USER = process.env.SMTP_USER || 'noreply@quotexautotrade.com';
const SMTP_PASS = process.env.SMTP_PASS || 'Noreplyqx@2026';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'QX AUTO TRADE';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@quotexautotrade.com';

const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Initialize Dual Transporters: Port 465 (Primary SSL) and Port 587 (Fallback TLS)
// Explicitly force family: 4 to avoid ENETUNREACH on cloud environments (e.g. Render IPv6 restrictions)
const transporter465 = nodemailer.createTransport({
  host: SMTP_HOST,
  port: 465,
  secure: true,
  family: 4,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000
});

const transporter587 = nodemailer.createTransport({
  host: SMTP_HOST,
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000
});

// Verify SMTP connection on startup
transporter587.verify((error, success) => {
  if (error) {
    console.warn(`[SMTP 587 WARN]: ${error.message}`);
  } else {
    console.log(`[SMTP SUCCESS] Hostinger SMTP ready on port 587 for ${SMTP_USER}`);
  }
});

/**
 * Send 6-Digit Email Verification OTP
 */
async function sendOtpEmail(toEmail, otpCode, recipientName = 'Trader') {
  const fromHeader = `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`;
  const subject = `${otpCode} is your QX Auto Trade Verification Code`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; margin: 0; padding: 0; color: #ffffff; }
        .container { max-width: 600px; margin: 20px auto; background: #131b2e; border-radius: 12px; overflow: hidden; border: 1px solid rgba(100,255,218,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #0a192f 0%, #172a45 100%); padding: 30px; text-align: center; border-bottom: 2px solid #00c076; }
        .logo-title { font-size: 26px; font-weight: 800; color: #64ffda; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; }
        .sub-logo { font-size: 12px; color: #8892b0; margin-top: 5px; }
        .body { padding: 35px 30px; text-align: center; }
        .greeting { font-size: 20px; font-weight: 600; color: #ffffff; margin-bottom: 15px; }
        .desc { font-size: 15px; color: #a8b2d1; line-height: 1.6; margin-bottom: 25px; }
        .otp-box { background: rgba(0, 192, 118, 0.12); border: 2px dashed #00c076; border-radius: 10px; padding: 20px; margin: 25px auto; max-width: 280px; }
        .otp-code { font-size: 36px; font-weight: 900; color: #64ffda; letter-spacing: 8px; margin: 0; font-family: monospace; }
        .expiry { font-size: 12px; color: #ffd700; margin-top: 8px; }
        .warning { font-size: 13px; color: #8892b0; margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; }
        .footer { background: #0a192f; padding: 20px; text-align: center; font-size: 12px; color: #5a6785; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-title">⚡ QX AUTO TRADE</h1>
          <div class="sub-logo">Automated Trading Bot Platform</div>
        </div>
        <div class="body">
          <div class="greeting">Hello ${recipientName},</div>
          <div class="desc">Thank you for starting your registration with <strong>QX Auto Trade</strong>. Please use the 6-digit Email OTP code below to verify your account and activate your Free Trial:</div>
          <div class="otp-box">
            <div class="otp-code">${otpCode}</div>
            <div class="expiry">⏱️ Valid for 10 Minutes Only</div>
          </div>
          <div class="warning">🔒 If you did not request this verification code, please ignore this email. Never share your OTP with anyone.</div>
        </div>
        <div class="footer">
          &copy; 2026 QX AUTO TRADE Platform. All Rights Reserved.<br>
          Sent from <a href="mailto:${SMTP_FROM_EMAIL}" style="color:#64ffda;text-decoration:none;">${SMTP_FROM_EMAIL}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    subject: subject,
    html: htmlContent
  };

  try {
    const info465 = await transporter465.sendMail(mailOptions);
    console.log(`[SMTP 465 SUCCESS] OTP Email sent to ${toEmail} | ID: ${info465.messageId}`);
    return { success: true, messageId: info465.messageId };
  } catch (err465) {
    console.warn(`[SMTP 465 Failed, falling back to 587]: ${err465.message}`);
    try {
      const info587 = await transporter587.sendMail(mailOptions);
      console.log(`[SMTP 587 SUCCESS] OTP Email sent to ${toEmail} | ID: ${info587.messageId}`);
      return { success: true, messageId: info587.messageId };
    } catch (err587) {
      console.error(`[SMTP ALL PORTS FAILED] for ${toEmail}:`, err587.message);
      return { success: false, error: err587.message };
    }
  }
}

/**
 * Send Welcome Greeting Email Upon Registration Completion
 */
async function sendWelcomeEmail(toEmail, recipientName = 'Trader', planName = 'Free Trial') {
  const fromHeader = `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`;
  const subject = `🎉 Welcome to QX Auto Trade - Your Account is Active!`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; margin: 0; padding: 0; color: #ffffff; }
        .container { max-width: 600px; margin: 20px auto; background: #131b2e; border-radius: 12px; overflow: hidden; border: 1px solid rgba(100,255,218,0.25); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #00c076 0%, #008f58 100%); padding: 35px; text-align: center; }
        .logo-title { font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase; margin: 0; }
        .sub-logo { font-size: 13px; color: rgba(255,255,255,0.9); margin-top: 5px; font-weight: 500; }
        .body { padding: 35px 30px; text-align: left; }
        .greeting { font-size: 22px; font-weight: 700; color: #64ffda; margin-bottom: 15px; text-align: center; }
        .desc { font-size: 15px; color: #a8b2d1; line-height: 1.6; margin-bottom: 20px; }
        .card { background: #0a192f; border: 1px solid rgba(100,255,218,0.2); border-radius: 10px; padding: 20px; margin: 20px 0; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 14px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #8892b0; }
        .card-val { color: #ffffff; font-weight: 600; }
        .btn-wrap { text-align: center; margin: 30px 0 15px 0; }
        .btn { background: linear-gradient(135deg, #00c076 0%, #2ed573 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 16px; font-weight: 700; border-radius: 8px; display: inline-block; box-shadow: 0 4px 15px rgba(0, 192, 118, 0.4); }
        .steps { background: rgba(100, 200, 255, 0.05); border-left: 4px solid #64c8ff; padding: 15px 20px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #d0d7de; }
        .steps ol { margin: 10px 0 0 20px; padding: 0; }
        .steps li { margin-bottom: 6px; }
        .footer { background: #0a192f; padding: 20px; text-align: center; font-size: 12px; color: #5a6785; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-title">⚡ QX AUTO TRADE</h1>
          <div class="sub-logo">Welcome to Automated Trading Excellence</div>
        </div>
        <div class="body">
          <div class="greeting">Welcome Aboard, ${recipientName}! 🎉</div>
          <div class="desc">Your account has been successfully created and verified. You now have full access to our automated binary trading bot platform, live OTC chart analysis, and strategy engines.</div>

          <div class="card">
            <div class="card-row">
              <span class="card-label">Account Holder:</span>
              <span class="card-val">${recipientName}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Registered Email:</span>
              <span class="card-val">${toEmail}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Active Plan:</span>
              <span class="card-val" style="color:#64ffda;">${planName}</span>
            </div>
            <div class="card-row">
              <span class="card-label">Server Status:</span>
              <span class="card-val" style="color:#2ed573;">🟢 ONLINE (v2.4.0)</span>
            </div>
          </div>

          <div class="steps">
            <strong>🚀 Quick Start Steps:</strong>
            <ol>
              <li>Log in to your <strong>QX Auto Trade Dashboard</strong>.</li>
              <li>Connect your <strong>Quotex / Pocket Option Account</strong>.</li>
              <li>Select <strong>Quotex OTC Volatility Scalper v3</strong> or your preferred strategy.</li>
              <li>Click <strong>START AUTO BOT</strong> to begin automated execution.</li>
            </ol>
          </div>

          <div class="btn-wrap">
            <a href="http://localhost:3000" class="btn">ACCESS TRADING DASHBOARD ➔</a>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 QX AUTO TRADE Platform. All Rights Reserved.<br>
          Sent from <a href="mailto:${SMTP_FROM_EMAIL}" style="color:#64ffda;text-decoration:none;">${SMTP_FROM_EMAIL}</a>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    subject: subject,
    html: htmlContent
  };

  try {
    const info465 = await transporter465.sendMail(mailOptions);
    console.log(`[SMTP 465 SUCCESS] Welcome Email sent to ${toEmail} | ID: ${info465.messageId}`);
    return { success: true, messageId: info465.messageId };
  } catch (err465) {
    try {
      const info587 = await transporter587.sendMail(mailOptions);
      console.log(`[SMTP 587 SUCCESS] Welcome Email sent to ${toEmail} | ID: ${info587.messageId}`);
      return { success: true, messageId: info587.messageId };
    } catch (err587) {
      console.error(`[SMTP ALL PORTS FAILED] Welcome email for ${toEmail}:`, err587.message);
      return { success: false, error: err587.message };
    }
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail
};
