const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../../.env') });
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false';
const SMTP_USER = process.env.SMTP_USER || 'noreply@quotexautotrade.com';
const SMTP_PASS = process.env.SMTP_PASS || 'Noreplyqx@2026';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'QuCaptain';
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@quotexautotrade.com';

const LOGO_URL = 'https://qucaptain.onrender.com/assets/qucaptain-logo.png';

// Port 587 STARTTLS
const transporter587 = nodemailer.createTransport({
  host: SMTP_HOST,
  port: 587,
  secure: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000
});

// Port 465 SSL
const transporter465 = nodemailer.createTransport({
  host: SMTP_HOST,
  port: 465,
  secure: true,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 10000
});

/**
 * Send 6-Digit Verification OTP Email
 */
async function sendOtpEmail(toEmail, otpCode, recipientName = 'Trader') {
  const fromHeader = `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`;
  const subject = `🔐 ${otpCode} is your QuCaptain Verification Code`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #080b11; margin: 0; padding: 0; color: #ffffff; }
        .container { max-width: 580px; margin: 24px auto; background: #0f1624; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 15px 40px rgba(0,0,0,0.6); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #8b5cf6; }
        .logo-img { width: 72px; height: 72px; border-radius: 16px; margin: 0 auto 12px auto; display: block; box-shadow: 0 8px 25px rgba(139,92,246,0.4); }
        .brand-title { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 1px; margin: 0; }
        .brand-subtitle { font-size: 13px; color: #a78bfa; margin-top: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .body { padding: 36px 28px; text-align: center; }
        .greeting { font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 12px; }
        .desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
        .otp-card { background: linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(59,130,246,0.1) 100%); border: 2px dashed #8b5cf6; border-radius: 14px; padding: 22px 16px; margin: 20px auto; max-width: 320px; }
        .otp-number { font-size: 38px; font-weight: 900; color: #a78bfa; letter-spacing: 10px; margin: 0; font-family: 'Courier New', monospace; }
        .expiry { font-size: 12px; color: #fbbf24; margin-top: 10px; font-weight: 600; }
        .security-notice { font-size: 12px; color: #64748b; margin-top: 28px; border-top: 1px solid #1e293b; padding-top: 18px; line-height: 1.5; }
        .footer { background: #0a0e17; padding: 22px; text-align: center; font-size: 12px; color: #475569; }
        .footer a { color: #8b5cf6; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="QuCaptain Logo" class="logo-img" />
          <h1 class="brand-title">QuCaptain</h1>
          <div class="brand-subtitle">AI Algorithmic Trading Platform</div>
        </div>
        <div class="body">
          <div class="greeting">Hello ${recipientName},</div>
          <div class="desc">Thank you for joining <strong>QuCaptain</strong>. Please enter the 6-digit verification code below to activate your account:</div>
          <div class="otp-card">
            <div class="otp-number">${otpCode}</div>
            <div class="expiry">⏱️ Valid for 10 Minutes Only</div>
          </div>
          <div class="security-notice">
            🔒 <strong>Security Warning:</strong> Never share this code with anyone. QuCaptain staff will never ask for your verification code.
          </div>
        </div>
        <div class="footer">
          &copy; 2026 QuCaptain. All Rights Reserved.<br>
          Sent from <a href="https://qucaptain.onrender.com">qucaptain.onrender.com</a>
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
    try {
      const info587 = await transporter587.sendMail(mailOptions);
      console.log(`[SMTP 587 SUCCESS] OTP Email sent to ${toEmail} | ID: ${info587.messageId}`);
      return { success: true, messageId: info587.messageId };
    } catch (err587) {
      console.error(`[SMTP ERROR] for ${toEmail}:`, err587.message);
      return { success: false, error: err587.message };
    }
  }
}

/**
 * Send Welcome Greeting Email Upon Registration Completion
 */
async function sendWelcomeEmail(toEmail, recipientName = 'Trader', planName = 'Free Trial') {
  const fromHeader = `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`;
  const subject = `🎉 Welcome to QuCaptain - Your Trading Bot Account is Active!`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #080b11; margin: 0; padding: 0; color: #ffffff; }
        .container { max-width: 580px; margin: 24px auto; background: #0f1624; border-radius: 16px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 15px 40px rgba(0,0,0,0.6); }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 24px; text-align: center; border-bottom: 2px solid #8b5cf6; }
        .logo-img { width: 72px; height: 72px; border-radius: 16px; margin: 0 auto 12px auto; display: block; box-shadow: 0 8px 25px rgba(139,92,246,0.4); }
        .brand-title { font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 1px; margin: 0; }
        .brand-subtitle { font-size: 13px; color: #a78bfa; margin-top: 4px; font-weight: 600; text-transform: uppercase; }
        .body { padding: 36px 28px; text-align: left; }
        .greeting { font-size: 22px; font-weight: 700; color: #a78bfa; margin-bottom: 14px; text-align: center; }
        .desc { font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 22px; }
        .card { background: #0a0e17; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin: 20px 0; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1e293b; font-size: 13px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #64748b; }
        .card-val { color: #f8fafc; font-weight: 600; }
        .btn-wrap { text-align: center; margin: 30px 0 15px 0; }
        .btn { background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; font-size: 15px; font-weight: 700; border-radius: 10px; display: inline-block; box-shadow: 0 6px 20px rgba(124,58,237,0.4); }
        .footer { background: #0a0e17; padding: 22px; text-align: center; font-size: 12px; color: #475569; }
        .footer a { color: #8b5cf6; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${LOGO_URL}" alt="QuCaptain Logo" class="logo-img" />
          <h1 class="brand-title">QuCaptain</h1>
          <div class="brand-subtitle">AI Algorithmic Trading Platform</div>
        </div>
        <div class="body">
          <div class="greeting">Welcome to QuCaptain, ${recipientName}! 🎉</div>
          <div class="desc">Your account has been successfully verified and activated. You now have full access to high-accuracy automated trading strategies and real-time execution.</div>

          <div class="card">
            <div class="card-row"><span class="card-label">Account Holder:</span><span class="card-val">${recipientName}</span></div>
            <div class="card-row"><span class="card-label">Email:</span><span class="card-val">${toEmail}</span></div>
            <div class="card-row"><span class="card-label">Plan:</span><span class="card-val" style="color:#a78bfa;">${planName}</span></div>
            <div class="card-row"><span class="card-label">System Status:</span><span class="card-val" style="color:#10b981;">🟢 Active Online</span></div>
          </div>

          <div class="btn-wrap">
            <a href="https://qucaptain.onrender.com" class="btn">LAUNCH QUCAPTAIN DASHBOARD ➔</a>
          </div>
        </div>
        <div class="footer">
          &copy; 2026 QuCaptain. All Rights Reserved.<br>
          Sent from <a href="https://qucaptain.onrender.com">qucaptain.onrender.com</a>
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
    return { success: true, messageId: info465.messageId };
  } catch (e) {
    try {
      const info587 = await transporter587.sendMail(mailOptions);
      return { success: true, messageId: info587.messageId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail
};
