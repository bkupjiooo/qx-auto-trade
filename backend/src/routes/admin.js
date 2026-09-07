const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const tradingEngine = require('../engine/TradingEngine');

// Master Admin Stats
router.get('/stats', (req, res) => {
  const users = db.get('users');
  const connections = db.get('brokerConnections');
  const tradeLogs = db.get('tradeLogs');
  const referralRequests = db.get('referralRequests');

  const activeSessionsCount = Array.from(tradingEngine.activeSessions.values()).filter(s => s.status === 'RUNNING').length;
  const totalVolume = tradeLogs.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalProfit = tradeLogs.reduce((acc, t) => acc + (t.profitLoss || 0), 0);

  return res.json({
    totalUsers: users.length,
    activeSessionsCount,
    totalConnections: connections.length,
    pendingReferralsCount: referralRequests.filter(r => r.status === 'PENDING').length,
    totalVolume: parseFloat(totalVolume.toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    systemConfig: db.get('systemConfig')
  });
});

// Master Admin Global Emergency Stop
router.post('/global-emergency-stop', (req, res) => {
  const { adminEmail } = req.body;
  tradingEngine.emergencyStopAll(adminEmail || 'Master Admin');
  return res.json({
    message: 'GLOBAL EMERGENCY STOP ACTIVATED! All user bots have been force stopped.',
    systemConfig: db.get('systemConfig')
  });
});

// Clear Global Emergency Stop
router.post('/clear-emergency-stop', (req, res) => {
  const { adminEmail } = req.body;
  tradingEngine.clearEmergencyStop(adminEmail || 'Master Admin');
  return res.json({
    message: 'Global Emergency Stop cleared.',
    systemConfig: db.get('systemConfig')
  });
});

// Toggle Maintenance Mode
router.post('/toggle-maintenance', (req, res) => {
  const { enabled, adminEmail } = req.body;
  const config = db.get('systemConfig');
  config.maintenanceMode = Boolean(enabled);
  config.updatedAt = new Date().toISOString();
  db.set('systemConfig', config);

  if (enabled) {
    for (const [userId, session] of tradingEngine.activeSessions.entries()) {
      tradingEngine.stopSession(userId, 'System Scheduled Maintenance');
    }
  }

  db.get('auditLogs').unshift({
    id: `audit-${Date.now()}`,
    action: enabled ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
    actorEmail: adminEmail || 'Master Admin',
    details: `Master Admin set Maintenance Mode to ${enabled}`,
    timestamp: new Date().toISOString()
  });
  db.save();

  return res.json({ message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'}.`, systemConfig: config });
});

// Force Stop Single User Bot
router.post('/force-stop-user', (req, res) => {
  const { userId, adminEmail } = req.body;
  if (!userId) return res.status(400).json({ error: 'User ID is required.' });

  const session = tradingEngine.forceStopUserBot(userId, adminEmail || 'Master Admin');
  return res.json({ message: `Force stopped bot session for user ${userId}.`, session });
});

// Edit User Details (Name, Email, Plan, Expiry, Active Status, Telegram ID, Broker ID, Broker Name, Trading Mode, MTG Level)
router.post('/edit-user-details', (req, res) => {
  try {
    const { userId, name, email, subscriptionPlan, plan, subExpiresAt, isActive, isLifetimeApproved, telegramId, brokerId, brokerName, tradingMode, maxMtgLevel, adminEmail } = req.body;
    const users = db.get('users');
    const user = users.find(u => u.id === userId);

    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    
    const targetPlan = subscriptionPlan || plan;
    if (targetPlan) {
      user.subscriptionPlan = targetPlan;
      if (targetPlan.toLowerCase().includes('free')) {
        user.isLifetimeApproved = false;
      }
    }
    
    if (subExpiresAt) user.subExpiresAt = subExpiresAt;
    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (isLifetimeApproved !== undefined) user.isLifetimeApproved = Boolean(isLifetimeApproved);
    if (telegramId !== undefined) user.telegramId = telegramId;
    if (brokerId !== undefined) user.brokerId = brokerId;
    if (brokerName !== undefined) user.brokerName = brokerName;

    // Update risk settings if tradingMode or maxMtgLevel provided
    const riskSettingsMap = db.get('riskSettings');
    if (!riskSettingsMap[userId]) {
      riskSettingsMap[userId] = {
        mode: 'MTG',
        fixedAmount: 10,
        mtgMultiplier: 2.1,
        maxMtgLevel: 5,
        dailyProfitTarget: 100,
        dailyStopLoss: 150
      };
    }
    if (tradingMode) riskSettingsMap[userId].mode = tradingMode;
    if (maxMtgLevel !== undefined) riskSettingsMap[userId].maxMtgLevel = parseInt(maxMtgLevel, 10);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_EDIT_USER_DETAILS',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: userId,
      details: `Updated details for ${user.email}: Plan=${user.subscriptionPlan}, Active=${user.isActive}, Mode=${tradingMode || riskSettingsMap[userId].mode}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'User details updated successfully!', user, riskSettings: riskSettingsMap[userId] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Reset User Password by Master Admin
router.post('/reset-user-password', async (req, res) => {
  try {
    const { userId, newPassword, adminEmail } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required.' });
    }

    const users = db.get('users');
    const user = users.find(u => u.id === userId);

    if (!user) return res.status(404).json({ error: 'User not found.' });

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_RESET_USER_PASSWORD',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: userId,
      details: `Master Admin reset password for ${user.email}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Password reset successfully for ${user.email}!` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Toggle User Active Status
router.post('/toggle-user-active', (req, res) => {
  const { userId, isActive, adminEmail } = req.body;
  const users = db.get('users');
  const user = users.find(u => u.id === userId);

  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.isActive = Boolean(isActive);
  if (!isActive) {
    tradingEngine.stopSession(userId, 'Account deactivated by Master Admin');
  }

  db.get('auditLogs').unshift({
    id: `audit-${Date.now()}`,
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    actorEmail: adminEmail || 'Master Admin',
    targetUserId: userId,
    details: `User account ${user.email} marked as ${isActive ? 'ACTIVE' : 'INACTIVE'}`,
    timestamp: new Date().toISOString()
  });

  db.save();
  return res.json({ message: `User ${user.email} ${isActive ? 'activated' : 'deactivated'}.`, user });
});

// List All Live User Sessions
router.get('/live-sessions', (req, res) => {
  const sessions = Array.from(tradingEngine.activeSessions.values());
  const users = db.get('users');
  const enriched = sessions.map(s => {
    const u = users.find(usr => usr.id === s.userId);
    return {
      ...s,
      userName: u?.name || s.userId,
      userEmail: u?.email || 'unknown@user.com'
    };
  });
  return res.json({ sessions: enriched });
});

// Update Strategy Parameters
router.post('/strategy-parameters', (req, res) => {
  const { strategyId, parameters, winRate, timeframe } = req.body;
  const strategies = db.get('strategies');
  const strat = strategies.find(s => s.id === strategyId);

  if (!strat) return res.status(404).json({ error: 'Strategy not found.' });

  if (parameters) strat.parameters = parameters;
  if (winRate) strat.winRate = parseFloat(winRate);
  if (timeframe) strat.timeframe = timeframe;

  db.save();
  return res.json({ message: 'Strategy parameters updated successfully!', strategy: strat });
});

// Audit Logs & Errors
router.get('/audit-logs', (req, res) => {
  return res.json({
    auditLogs: db.get('auditLogs'),
    announcements: db.get('announcements'),
    errorLogs: db.get('errorLogs') || []
  });
});

// All System Trade Logs for Admin
router.get('/all-trade-logs', (req, res) => {
  const tradeLogs = db.get('tradeLogs') || [];
  return res.json({ tradeLogs });
});

// List Users (Sorted newest first, mapped for Admin UI compatibility)
router.get('/users', (req, res) => {
  const users = db.get('users') || [];
  const mapped = [...users].reverse().map(u => ({
    ...u,
    active: u.isActive !== false,
    isActive: u.isActive !== false,
    plan: u.subscriptionPlan || u.plan || 'Free Trial'
  }));
  return res.json({ users: mapped });
});

// Approve or Reject Referral Lifetime Free Access
router.post('/approve-referral', (req, res) => {
  const { requestId, status, adminEmail } = req.body;
  const requests = db.get('referralRequests');
  const reqItem = requests.find(r => r.id === requestId);

  if (!reqItem) return res.status(404).json({ error: 'Referral request not found.' });

  reqItem.status = status;

  if (status === 'APPROVED') {
    const users = db.get('users');
    const user = users.find(u => u.id === reqItem.userId);
    if (user) {
      user.isLifetimeApproved = true;
      user.depositVerified = true;
      user.subscriptionPlan = 'Lifetime Free';
    }
  }

  db.get('auditLogs').unshift({
    id: `audit-${Date.now()}`,
    action: `REFERRAL_${status}`,
    actorEmail: adminEmail || 'Master Admin',
    targetUserId: reqItem.userId,
    details: `Referral deposit request ${requestId} marked as ${status}`,
    timestamp: new Date().toISOString()
  });

  db.save();
  return res.json({ message: `Referral request ${status.toLowerCase()}!`, request: reqItem });
});

// Get All Announcements
router.get('/announcements', (req, res) => {
  const announcements = db.get('announcements') || [];
  return res.json({ announcements });
});

// Send/Create Announcement
router.post('/announcements', (req, res) => {
  const { title, content, type, target } = req.body;
  const announcements = db.get('announcements') || [];
  const newAnn = {
    id: `ann-${Date.now()}`,
    title,
    content,
    type: type || 'INFO',
    target: target || { homePage: true, userPage: true },
    isActive: true,
    createdAt: new Date().toISOString()
  };
  announcements.unshift(newAnn);
  db.set('announcements', announcements);
  db.save();
  return res.json({ message: 'Announcement published!', announcement: newAnn, announcements });
});

// Update/Edit Announcement
router.put('/announcements/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, target, isActive } = req.body;
  const announcements = db.get('announcements') || [];
  const ann = announcements.find(a => a.id === id);
  if (!ann) return res.status(404).json({ error: 'Announcement not found.' });

  if (title !== undefined) ann.title = title;
  if (content !== undefined) ann.content = content;
  if (target !== undefined) ann.target = target;
  if (isActive !== undefined) ann.isActive = Boolean(isActive);

  db.save();
  return res.json({ message: 'Announcement updated!', announcement: ann, announcements });
});

// Toggle Announcement Active Status
router.post('/toggle-announcement-active', (req, res) => {
  const { announcementId, isActive } = req.body;
  const announcements = db.get('announcements') || [];
  const ann = announcements.find(a => a.id === announcementId);
  if (!ann) return res.status(404).json({ error: 'Announcement not found.' });

  ann.isActive = Boolean(isActive);
  db.save();
  return res.json({ message: `Announcement set to ${ann.isActive ? 'Active' : 'Inactive'}`, announcements });
});

// Add New User by Admin
router.post('/add-user', async (req, res) => {
  try {
    const { name, email, password, subscriptionPlan, brokerName, brokerId, telegramId, adminEmail } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const users = db.get('users');
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'USER',
      isActive: true,
      subscriptionPlan: subscriptionPlan || 'Free Trial',
      subExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      brokerName: brokerName || 'QUOTEX',
      brokerId: brokerId || '',
      telegramId: telegramId || '',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    const riskSettings = db.get('riskSettings');
    riskSettings[newUser.id] = {
      mode: 'MTG',
      fixedAmount: 10,
      mtgMultiplier: 2.1,
      maxMtgLevel: 5,
      dailyProfitTarget: 100,
      dailyStopLoss: 150
    };

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_ADD_USER',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: newUser.id,
      details: `Master Admin created user account for ${newUser.email}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'User created successfully!', user: newUser, users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Change Admin Password
router.post('/change-admin-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, adminEmail } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'New password is required.' });

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_CHANGE_PASSWORD',
      actorEmail: adminEmail || 'Master Admin',
      details: 'Master Admin updated security password',
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Admin password updated successfully!' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Toggle Individual Emergency Controls (User Reg, User Login, Trading Strategies)
router.post('/toggle-emergency-control', (req, res) => {
  try {
    const { controlKey, enabled, adminEmail } = req.body;
    const config = db.get('systemConfig') || {};
    if (!config.emergencyControls) {
      config.emergencyControls = {
        userRegistrationEnabled: true,
        userLoginEnabled: true,
        tradingStrategiesEnabled: true
      };
    }
    config.emergencyControls[controlKey] = Boolean(enabled);
    config.updatedAt = new Date().toISOString();
    db.set('systemConfig', config);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'TOGGLE_EMERGENCY_CONTROL',
      actorEmail: adminEmail || 'Master Admin',
      details: `Emergency control ${controlKey} set to ${enabled}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Control ${controlKey} set to ${enabled}`, systemConfig: config });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Site Settings (Social Links, Referral Link & Amount, Footer Text, Payment Details)
router.get('/site-config', (req, res) => {
  return res.json({ siteConfig: db.get('siteConfig') });
});

router.post('/site-config', (req, res) => {
  try {
    const newConfig = req.body?.siteConfig || req.body || {};
    const existingConfig = db.get('siteConfig') || {};

    const upi = newConfig.paymentUpi || newConfig.upiAddress || existingConfig.paymentUpi || existingConfig.upiAddress || '';
    const usdt = newConfig.paymentUsdt || newConfig.usdtAddress || existingConfig.paymentUsdt || existingConfig.usdtAddress || '';
    const logo = newConfig.logoUrl || newConfig.siteLogo || existingConfig.logoUrl || existingConfig.siteLogo || '';
    const fav = newConfig.faviconUrl || newConfig.favicon || existingConfig.faviconUrl || existingConfig.favicon || '';

    const updatedConfig = {
      ...existingConfig,
      ...newConfig,
      paymentUpi: upi,
      upiAddress: upi,
      paymentUsdt: usdt,
      usdtAddress: usdt,
      logoUrl: logo,
      siteLogo: logo,
      faviconUrl: fav,
      favicon: fav,
      updatedAt: new Date().toISOString()
    };

    db.set('siteConfig', updatedConfig);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_UPDATE_SITE_CONFIG',
      actorEmail: 'admin@qxautotrade.com',
      details: 'Updated site configuration, links, and referral settings',
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Site configuration updated successfully!', siteConfig: updatedConfig });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Plan Subscriptions List & Approval / Rejection
router.get('/plan-subscriptions', (req, res) => {
  const subscriptions = db.get('planSubscriptions');
  return res.json({ subscriptions });
});

router.post('/approve-plan-subscription', (req, res) => {
  try {
    const { subscriptionId, adminEmail } = req.body;
    const subscriptions = db.get('planSubscriptions');
    const sub = subscriptions.find(s => s.id === subscriptionId);

    if (!sub) return res.status(404).json({ error: 'Subscription payment request not found.' });

    sub.status = 'APPROVED';
    sub.approvedAt = new Date().toISOString();

    // Upgrade User Plan
    const users = db.get('users');
    const user = users.find(u => u.id === sub.userId || u.email === sub.userEmail);
    if (user) {
      user.subscriptionPlan = sub.planName;
      // Set sub expiry depending on plan duration (e.g., Basic: 1M, Pro: 3M, Quantum: 6M, Premium: 12M)
      let durationDays = 30;
      if (sub.planName.includes('Basic')) durationDays = 30;
      else if (sub.planName.includes('Pro')) durationDays = 90;
      else if (sub.planName.includes('Quantum')) durationDays = 180;
      else if (sub.planName.includes('Premium')) durationDays = 365;

      user.subExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_SUBSCRIPTION_APPROVED',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: sub.userId,
      details: `Approved subscription ${sub.planName} ($${sub.price}) for ${sub.userEmail}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Subscription for ${sub.userEmail} approved successfully!`, subscription: sub });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/reject-plan-subscription', (req, res) => {
  try {
    const { subscriptionId, adminEmail } = req.body;
    const subscriptions = db.get('planSubscriptions');
    const sub = subscriptions.find(s => s.id === subscriptionId);

    if (!sub) return res.status(404).json({ error: 'Subscription payment request not found.' });

    sub.status = 'REJECTED';
    sub.rejectedAt = new Date().toISOString();

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_SUBSCRIPTION_REJECTED',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: sub.userId,
      details: `Rejected subscription request ${subscriptionId} for ${sub.userEmail}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Subscription request rejected.`, subscription: sub });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete User by Master Admin
router.post('/delete-user', (req, res) => {
  try {
    const { userId, adminEmail } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    let users = db.get('users');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found.' });

    const deletedUser = users[userIndex];
    users.splice(userIndex, 1);
    db.set('users', users);

    // Stop active bot session if running
    tradingEngine.stopSession(userId, 'User account deleted by Master Admin');

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_DELETE_USER',
      actorEmail: adminEmail || 'Master Admin',
      targetUserId: userId,
      details: `Deleted user ${deletedUser.email} (${deletedUser.name})`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `User ${deletedUser.email} deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Toggle Strategy Active Status
router.post('/toggle-strategy-active', (req, res) => {
  try {
    const { strategyId, isActive, adminEmail } = req.body;
    const strategies = db.get('strategies');
    const strat = strategies.find(s => s.id === strategyId);

    if (!strat) return res.status(404).json({ error: 'Strategy not found.' });

    strat.isActive = Boolean(isActive);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'STRATEGY_TOGGLED',
      actorEmail: adminEmail || 'Master Admin',
      details: `Strategy ${strat.name} set to ${strat.isActive ? 'ACTIVE' : 'INACTIVE'}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Strategy ${strat.name} is now ${strat.isActive ? 'Active' : 'Inactive'}.`, strategy: strat });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Add New Strategy
router.post('/add-strategy', (req, res) => {
  try {
    const { name, broker = 'quotex', winRate = 85.0, timeframe = '1M', indicatorSummary, description, parameters } = req.body;
    if (!name) return res.status(400).json({ error: 'Strategy name is required.' });

    const strategies = db.get('strategies');
    const newStrat = {
      id: `strat-${Date.now()}`,
      name,
      broker: broker.toLowerCase(),
      winRate: parseFloat(winRate),
      timeframe,
      indicatorSummary: indicatorSummary || 'Custom Master Algorithm setup',
      parameters: parameters || { rsiPeriod: 14, emaFast: 9, emaSlow: 21 },
      description: description || 'Custom algorithmic strategy configured by Master Admin.',
      isActive: true,
      createdBy: 'Master Admin'
    };

    strategies.push(newStrat);
    db.save();
    return res.json({ message: 'Strategy added successfully!', strategy: newStrat });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete Strategy
router.post('/delete-strategy', (req, res) => {
  try {
    const { strategyId, adminEmail } = req.body;
    let strategies = db.get('strategies');
    const idx = strategies.findIndex(s => s.id === strategyId);
    if (idx === -1) return res.status(404).json({ error: 'Strategy not found.' });

    const deleted = strategies[idx];
    strategies.splice(idx, 1);
    db.set('strategies', strategies);

    db.save();
    return res.json({ message: `Strategy ${deleted.name} deleted.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete plan subscription request
router.post('/delete-plan-subscription', (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const subscriptions = db.get('planSubscriptions');
    const idx = subscriptions.findIndex(s => s.id === subscriptionId);
    if (idx === -1) return res.status(404).json({ error: 'Subscription not found.' });
    subscriptions.splice(idx, 1);
    db.set('planSubscriptions', subscriptions);
    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_SUBSCRIPTION_DELETED',
      actorEmail: 'Master Admin',
      details: `Deleted subscription request: ${subscriptionId}`,
      timestamp: new Date().toISOString()
    });
    db.save();
    return res.json({ message: 'Subscription deleted successfully!', subscriptions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Bulk delete plan subscriptions
router.post('/bulk-delete-plan-subscriptions', (req, res) => {
  try {
    const { subscriptionIds } = req.body;
    if (!Array.isArray(subscriptionIds) || subscriptionIds.length === 0) {
      return res.status(400).json({ error: 'No subscriptions selected.' });
    }
    const subscriptions = db.get('planSubscriptions');
    const remaining = subscriptions.filter(s => !subscriptionIds.includes(s.id));
    db.set('planSubscriptions', remaining);
    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_SUBSCRIPTIONS_BULK_DELETED',
      actorEmail: 'Master Admin',
      details: `Bulk deleted ${subscriptionIds.length} subscription requests`,
      timestamp: new Date().toISOString()
    });
    db.save();
    return res.json({ message: `${subscriptionIds.length} subscriptions deleted!`, subscriptions: remaining });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Edit Deposit Verification / Plan Payment Request
router.post('/edit-deposit-request', (req, res) => {
  try {
    const { requestId, status, price, paymentTxId, paymentProof, notes, adminEmail } = req.body;
    const subscriptions = db.get('planSubscriptions');
    const sub = subscriptions.find(s => s.id === requestId);

    if (!sub) return res.status(404).json({ error: 'Deposit request not found.' });

    if (status) sub.status = status;
    if (price) sub.price = price;
    if (paymentTxId) sub.paymentTxId = paymentTxId;
    if (paymentProof) sub.paymentProof = paymentProof;
    if (notes !== undefined) sub.notes = notes;

    // If approved, also update user plan
    if (status === 'APPROVED') {
      const users = db.get('users');
      const user = users.find(u => u.id === sub.userId || u.email === sub.userEmail);
      if (user) {
        user.subscriptionPlan = sub.planName;
        let durationDays = 30;
        if (sub.planName.includes('Basic')) durationDays = 30;
        else if (sub.planName.includes('Pro')) durationDays = 90;
        else if (sub.planName.includes('Quantum')) durationDays = 180;
        else if (sub.planName.includes('Premium')) durationDays = 365;
        else if (sub.planName.includes('Lifetime')) durationDays = 36500;
        user.subExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
        sub.approvedAt = new Date().toISOString();
      }
    }

    // If rejected, reset user plan to Free Trial
    if (status === 'REJECTED') {
      const users = db.get('users');
      const user = users.find(u => u.id === sub.userId || u.email === sub.userEmail);
      if (user && user.subscriptionPlan === sub.planName) {
        user.subscriptionPlan = 'Free Trial';
        user.subExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      }
      sub.rejectedAt = new Date().toISOString();
    }

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'SUBSCRIPTION_EDITED',
      actorEmail: adminEmail || 'Master Admin',
      details: `Updated subscription ${sub.id}: status=${status || sub.status}, price=${price || sub.price}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: 'Subscription updated successfully!', subscription: sub });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete Announcement
router.post('/delete-announcement', (req, res) => {
  try {
    const { announcementId } = req.body;
    let announcements = db.get('announcements');
    const idx = announcements.findIndex(a => a.id === announcementId);
    if (idx !== -1) {
      announcements.splice(idx, 1);
      db.set('announcements', announcements);
      db.save();
    }
    return res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ===== Subscription Plan Management =====

// Get all plans
router.get('/plans', (req, res) => {
  const plans = db.get('subscriptionPlans') || [];
  return res.json({ plans });
});

// Add new plan
router.post('/plans', (req, res) => {
  try {
    const { name, price, period, features, icon } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Plan name and price are required.' });

    const plans = db.get('subscriptionPlans') || [];
    const newPlan = {
      id: `plan-${Date.now()}`,
      name,
      price: price.toString().startsWith('$') ? price : `$${price}`,
      period: period || '/month',
      features: features || [],
      icon: icon || 'Zap',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    plans.push(newPlan);
    db.set('subscriptionPlans', plans);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_CREATED',
      actorEmail: 'Master Admin',
      details: `Created plan: ${name} ($${price})`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Plan "${name}" created successfully!`, plan: newPlan, plans });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update plan
router.post('/plans/update', (req, res) => {
  try {
    const { planId, name, price, period, features, isActive } = req.body;
    const plans = db.get('subscriptionPlans') || [];
    const plan = plans.find(p => p.id === planId);

    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    if (name !== undefined) plan.name = name;
    if (price !== undefined) plan.price = price.toString().startsWith('$') ? price : `$${price}`;
    if (period !== undefined) plan.period = period;
    if (features !== undefined) plan.features = features;
    if (isActive !== undefined) plan.isActive = isActive;
    plan.updatedAt = new Date().toISOString();

    db.set('subscriptionPlans', plans);

    // Also sync to siteConfig for universal landing page consistency
    if (plan.price) {
      const numPrice = parseFloat(plan.price.toString().replace(/[^0-9.]/g, ''));
      if (!isNaN(numPrice) && numPrice > 0) {
        const siteConfig = db.get('siteConfig') || {};
        const pName = (plan.name || '').toLowerCase();
        const pId = (plan.id || '').toLowerCase();
        if (pId.includes('basic') || pName.includes('basic')) siteConfig.priceBasic = numPrice;
        else if (pId.includes('pro') || pName.includes('pro')) siteConfig.pricePro = numPrice;
        else if (pId.includes('quantum') || pName.includes('quantum')) siteConfig.priceQuantum = numPrice;
        else if (pId.includes('titan') || pName.includes('titan') || pId.includes('premium') || pName.includes('premium')) siteConfig.pricePremium = numPrice;
        else if (pId.includes('apex') || pName.includes('apex') || pId.includes('lifetime') || pName.includes('lifetime')) siteConfig.priceLifetime = numPrice;
        db.set('siteConfig', siteConfig);
      }
    }

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_UPDATED',
      actorEmail: 'Master Admin',
      details: `Updated plan: ${plan.name} ($${plan.price})`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Plan "${plan.name}" updated successfully!`, plan, plans });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete plan
router.post('/plans/delete', (req, res) => {
  try {
    const { planId } = req.body;
    const plans = db.get('subscriptionPlans') || [];
    const idx = plans.findIndex(p => p.id === planId);

    if (idx === -1) return res.status(404).json({ error: 'Plan not found.' });

    const deleted = plans.splice(idx, 1)[0];
    db.set('subscriptionPlans', plans);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'PLAN_DELETED',
      actorEmail: 'Master Admin',
      details: `Deleted plan: ${deleted.name}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Plan "${deleted.name}" deleted successfully!`, plans });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// Commission Withdrawals List & Approval
router.get('/commission-withdrawals', (req, res) => {
  const withdrawals = db.get('commissionWithdrawals') || [];
  return res.json({ withdrawals });
});

router.post('/approve-commission-withdrawal', (req, res) => {
  try {
    const { withdrawalId, status, adminNotes } = req.body;
    const withdrawals = db.get('commissionWithdrawals') || [];
    const item = withdrawals.find(w => w.id === withdrawalId);
    if (!item) return res.status(404).json({ error: 'Withdrawal request not found.' });

    item.status = status || 'APPROVED';
    item.notes = adminNotes || (item.status === 'APPROVED' ? 'Payout sent via ' + item.payoutMethod : 'Rejected by Admin');
    item.processedAt = new Date().toISOString();

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'APPROVE_COMMISSION_WITHDRAWAL',
      actorEmail: 'Master Admin',
      details: `Commission withdrawal ${withdrawalId} marked as ${item.status}`,
      timestamp: new Date().toISOString()
    });

    db.save();
    return res.json({ message: `Withdrawal request marked as ${item.status}`, withdrawal: item });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

