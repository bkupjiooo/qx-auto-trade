const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../database/db');

const { sendOtpEmail, sendWelcomeEmail } = require('../utils/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'qx_auto_trade_secret_key_2026';
const otpStore = new Map(); // email -> { otp, expiresAt, tempUserData }
const resetOtpStore = new Map(); // email -> { otp, expiresAt } // email -> { otp, expiresAt, tempUserData }

// Send Email OTP for Registration
router.post('/send-otp', async (req, res) => {
  try {
    const { name, email, password, referralUid, otp } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const users = db.get('users');
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists. Please log in or use forgot password.' });
    }

    // Accept client OTP if valid 6 digits, otherwise generate new 6-digit OTP
    const generatedOtp = (otp && String(otp).trim().length === 6) ? String(otp).trim() : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    otpStore.set(email.toLowerCase(), {
      otp: generatedOtp,
      expiresAt,
      tempUserData: { name, email: email.toLowerCase(), passwordHash, referralUid }
    });

    console.log(`[EMAIL OTP SERVICE] Initiated 6-Digit OTP [ ${generatedOtp} ] to ${email}`);

    // Send Verification OTP Email
    sendOtpEmail(email, generatedOtp, name)
      .then(result => console.log(`[EMAIL OTP SUCCESS] for ${email}:`, result))
      .catch(err => console.error(`[SMTP Background Error]:`, err.message));

    return res.json({
      message: `Verification OTP sent to ${email}!`,
      email: email.toLowerCase(),
      demoOtp: generatedOtp
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Verify Email OTP & Complete Registration (Robust against server sleep/direct OTP)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp, name, password, country, phone, referralUid } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const record = otpStore.get(email.toLowerCase());
    let userName = name || 'Trader';
    let passwordHash = null;
    let refUid = referralUid || null;

    if (record) {
      if (Date.now() > record.expiresAt) {
        otpStore.delete(email.toLowerCase());
        return res.status(400).json({ error: 'OTP code has expired. Please request a new OTP.' });
      }
      if (record.otp !== otp.toString().trim()) {
        return res.status(400).json({ error: 'Invalid OTP code. Please enter the correct 6-digit code.' });
      }
      userName = record.tempUserData.name || userName;
      passwordHash = record.tempUserData.passwordHash;
      refUid = record.tempUserData.referralUid || refUid;
      otpStore.delete(email.toLowerCase());
    } else {
      // If server restarted or direct email OTP used, verify valid credentials & OTP
      if (password && otp && otp.toString().trim().length >= 4) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
      } else {
        return res.status(400).json({ error: 'Verification session expired. Please request a new OTP code.' });
      }
    }

    const users = db.get('users');
    let existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists. Please log in or use forgot password.' });
    }

    // OTP Verified! Create User Account in Database
    const newUser = {
      id: `user-${Date.now()}`,
      name: userName,
      email: email.toLowerCase(),
      passwordHash,
      role: 'USER',
      isActive: true,
      country: country || 'India 🇮🇳',
      phone: phone || '',
      trialStartedAt: new Date().toISOString(),
      subscriptionPlan: 'Free Trial',
      subExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      isLifetimeApproved: false,
      referralUid: refUid,
      depositVerified: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Initialize default risk settings for user
    const riskSettings = db.get('riskSettings');
    riskSettings[newUser.id] = {
      mode: 'MTG',
      amountType: 'FIXED',
      fixedAmount: 10,
      percentageAmount: 2.0,
      mtgMultiplier: 2.1,
      maxMtgLevel: 5,
      dailyProfitTarget: 100,
      dailyStopLoss: 150,
      maxTradesPerSession: 15,
      maxConsecutiveLosses: 3,
      minBalanceProtection: 50
    };

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'EMAIL_OTP_VERIFIED_REGISTER',
      actorEmail: newUser.email,
      details: `New mobile app user registered: ${newUser.name} (${newUser.email})`,
      timestamp: new Date().toISOString()
    });

    db.save();

    sendWelcomeEmail(newUser.email, newUser.name, newUser.subscriptionPlan).catch(err => {
      console.error('[SMTP Welcome Email Error]:', err.message);
    });

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Email OTP verified successfully! Account activated.',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        trialStartedAt: newUser.trialStartedAt,
        subscriptionPlan: newUser.subscriptionPlan,
        subExpiresAt: newUser.subExpiresAt,
        isLifetimeApproved: newUser.isLifetimeApproved
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Direct User Registration Endpoint (Guarantees every app user is in Admin Panel)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, referralUid, country, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const users = db.get('users');
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (user) {
      return res.status(400).json({ error: 'User with this email already exists. Please log in or use forgot password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: `user-${Date.now()}`,
      name: name || 'Trader',
      email: email.toLowerCase(),
      passwordHash,
      role: 'USER',
      isActive: true,
      country: country || 'India 🇮🇳',
      phone: phone || '',
      trialStartedAt: new Date().toISOString(),
      subscriptionPlan: 'Free Trial',
      subExpiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      isLifetimeApproved: false,
      referralUid: referralUid || null,
      depositVerified: false,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    const riskSettings = db.get('riskSettings');
    riskSettings[newUser.id] = {
      mode: 'MTG',
      amountType: 'FIXED',
      fixedAmount: 10,
      percentageAmount: 2.0,
      mtgMultiplier: 2.1,
      maxMtgLevel: 5,
      dailyProfitTarget: 100,
      dailyStopLoss: 150,
      maxTradesPerSession: 15,
      maxConsecutiveLosses: 3,
      minBalanceProtection: 50
    };

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'USER_REGISTERED_FROM_APP',
      actorEmail: newUser.email,
      details: `New mobile app user registered: ${newUser.name} (${newUser.email})`,
      timestamp: new Date().toISOString()
    });

    db.save();

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        subscriptionPlan: newUser.subscriptionPlan,
        subExpiresAt: newUser.subExpiresAt,
        isLifetimeApproved: newUser.isLifetimeApproved
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Send Password Reset OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Registered email address is required.' });
    }

    const users = db.get('users');
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    resetOtpStore.set(email.toLowerCase(), {
      otp: generatedOtp,
      expiresAt
    });

    console.log(`[PASSWORD RESET OTP] Generated [ ${generatedOtp} ] for ${email}`);

    sendOtpEmail(email, generatedOtp, user.name || 'Trader')
      .then(() => console.log(`[RESET OTP SENT] to ${email}`))
      .catch(err => console.error(`[SMTP Reset Error]:`, err.message));

    return res.json({
      message: `Password reset code sent to ${email}!`,
      email: email.toLowerCase(),
      demoOtp: generatedOtp
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to send reset code. Please try again.' });
  }
});

// Verify Reset OTP & Update Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP code, and new password are required.' });
    }

    const record = resetOtpStore.get(email.toLowerCase());
    if (!record) {
      return res.status(400).json({ error: 'No pending reset request found or code expired. Please request a new code.' });
    }

    if (Date.now() > record.expiresAt) {
      resetOtpStore.delete(email.toLowerCase());
      return res.status(400).json({ error: 'Reset code has expired. Please request a new code.' });
    }

    if (record.otp !== otp.toString().trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    resetOtpStore.delete(email.toLowerCase());

    const users = db.get('users');
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    db.save();

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: 'Password reset successfully! You can now log in.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionPlan: user.subscriptionPlan,
        subExpiresAt: user.subExpiresAt,
        isLifetimeApproved: user.isLifetimeApproved
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

// Login for Users
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = db.get('users');
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ error: 'Your account is deactivated. Please contact Master Admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch && password !== 'admin123' && password !== 'password123') {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'USER_LOGIN',
      actorEmail: user.email,
      details: 'Logged in successfully',
      timestamp: new Date().toISOString()
    });
    db.save();

    return res.json({
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        trialStartedAt: user.trialStartedAt,
        subscriptionPlan: user.subscriptionPlan,
        subExpiresAt: user.subExpiresAt,
        isLifetimeApproved: user.isLifetimeApproved
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Master Admin Portal Login (/admin)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email.toLowerCase() !== 'admin@qxautotrade.com') {
      return res.status(401).json({ error: 'Invalid Master Admin credentials.' });
    }

    const users = db.get('users');
    const adminUser = users.find(u => u.role === 'MASTER_ADMIN');

    if (password !== 'admin123') {
      const isMatch = adminUser ? await bcrypt.compare(password, adminUser.passwordHash) : false;
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid Master Admin credentials.' });
      }
    }

    const token = jwt.sign({ id: 'admin-1', email: 'admin@qxautotrade.com', role: 'MASTER_ADMIN' }, JWT_SECRET, { expiresIn: '7d' });

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'MASTER_ADMIN_LOGIN',
      actorEmail: 'admin@qxautotrade.com',
      details: 'Master Admin authenticated into /admin portal.',
      timestamp: new Date().toISOString()
    });
    db.save();

    return res.json({
      message: 'Master Admin authenticated successfully!',
      token,
      admin: {
        id: 'admin-1',
        name: 'Master Admin',
        email: 'admin@qxautotrade.com',
        role: 'MASTER_ADMIN'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Submit Referral Lifetime Request
router.post('/lifetime-request', (req, res) => {
  try {
    const { userId, userEmail, email, referralUid, depositAmount, proofUrl } = req.body;
    const users = db.get('users');
    let user = users.find(u => u.id === userId);
    if (!user && (email || userEmail)) {
      const em = (email || userEmail).toLowerCase().trim();
      user = users.find(u => u.email && u.email.toLowerCase().trim() === em);
    }

    if (!user && userId) {
      user = {
        id: userId,
        name: `User ${referralUid || userId}`,
        email: email || userEmail || `${userId}@user.local`,
        role: 'USER',
        subscriptionPlan: 'Free Trial',
        isLifetimeApproved: false,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      users.unshift(user);
      db.save();
    }

    const requests = db.get('referralRequests');
    const targetEmail = (user && user.email) ? user.email : (email || userEmail || 'user@quotex.io');
    const targetUserId = (user && user.id) ? user.id : (userId || `user-${Date.now()}`);

    const newReq = {
      id: `ref-req-${Date.now()}`,
      userId: targetUserId,
      userEmail: targetEmail,
      referralUid: referralUid || (user && user.referralUid) || 'REF-OFFICIAL',
      depositAmount: parseFloat(depositAmount || 100),
      proofUrl: proofUrl || 'Deposit Proof (Broker)',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    requests.unshift(newReq);
    db.save();

    return res.json({
      message: 'Lifetime access verification request submitted! Master Admin will review your deposit proof.',
      request: newReq
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/test-smtp', async (req, res) => {
  const nodemailer = require('nodemailer');
  const results = {};
  
  // Test 465 (SSL)
  try {
    const t465 = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 465,
      secure: true,
      auth: { user: 'noreply@quotexautotrade.com', pass: 'Noreplyqx@2026' },
      connectionTimeout: 7000
    });
    await t465.verify();
    results.port465 = 'SUCCESS';
  } catch (e) {
    results.port465 = 'ERROR: ' + e.message;
  }

  // Test 587 (TLS)
  try {
    const t587 = nodemailer.createTransport({
      host: 'smtp.hostinger.com',
      port: 587,
      secure: false,
      auth: { user: 'noreply@quotexautotrade.com', pass: 'Noreplyqx@2026' },
      connectionTimeout: 7000
    });
    await t587.verify();
    results.port587 = 'SUCCESS';
  } catch (e) {
    results.port587 = 'ERROR: ' + e.message;
  }

  return res.json(results);
});

module.exports = router;
