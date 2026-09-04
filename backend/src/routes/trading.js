const express = require('express');
const router = express.Router();
const db = require('../database/db');
const tradingEngine = require('../engine/TradingEngine');

// Get active session status
router.get('/session/:userId', (req, res) => {
  const { userId } = req.params;
  const session = tradingEngine.getSession(userId);
  const riskSettings = db.get('riskSettings')[userId] || {
    mode: 'MTG',
    fixedAmount: 20,
    mtgMultiplier: 2.1,
    maxMtgLevel: 5,
    dailyProfitTarget: 150,
    dailyStopLoss: 200,
    maxTradesPerSession: 20,
    minBalanceProtection: 100
  };

  let logs = db.get('tradeLogs').filter(t => t.userId === userId || t.userId === 'user-1' || t.userId === 'user-demo-1' || !t.userId || t.userId === 'all').slice(0, 50);
  if (!logs || logs.length === 0) {
    logs = db.get('tradeLogs').slice(0, 50);
  }

  return res.json({
    session,
    riskSettings,
    recentTrades: logs,
    systemConfig: db.get('systemConfig')
  });
});

// Start active session
router.post('/start', (req, res) => {
  try {
    const { userId, broker, strategyId, accountType } = req.body;
    if (!userId || !broker || !strategyId) {
      return res.status(400).json({ error: 'User ID, Broker, and Strategy ID are required.' });
    }

    const session = tradingEngine.startSession(userId, { broker, strategyId, accountType });
    return res.json({ message: 'Trading session started successfully!', session });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Pause session
router.post('/pause', (req, res) => {
  const { userId } = req.body;
  const session = tradingEngine.pauseSession(userId);
  return res.json({ message: 'Trading session paused.', session });
});

// Resume session
router.post('/resume', (req, res) => {
  const { userId } = req.body;
  const session = tradingEngine.resumeSession(userId);
  return res.json({ message: 'Trading session resumed.', session });
});

// Stop session
router.post('/stop', (req, res) => {
  const { userId, reason } = req.body;
  const session = tradingEngine.stopSession(userId, reason || 'User stopped session');
  return res.json({ message: 'Trading session stopped.', session });
});

// User Emergency Stop
router.post('/emergency-stop', (req, res) => {
  const { userId } = req.body;
  const session = tradingEngine.stopSession(userId, 'EMERGENCY_STOP_TRIGGERED');
  return res.json({ message: 'EMERGENCY STOP ACTIVATED! Session halted instantly.', session });
});

// Save Risk & Target Settings
router.post('/risk-settings', (req, res) => {
  try {
    const { userId, mode, fixedAmount, mtgMultiplier, maxMtgLevel, dailyProfitTarget, dailyStopLoss, maxTradesPerSession, minBalanceProtection } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID is required.' });

    const riskMap = db.get('riskSettings');
    riskMap[userId] = {
      mode: mode === 'NON_MTG' ? 'NON_MTG' : 'MTG',
      fixedAmount: parseFloat(fixedAmount || 20),
      mtgMultiplier: parseFloat(mtgMultiplier || 2.1),
      maxMtgLevel: Math.min(5, parseInt(maxMtgLevel || 5, 10)), // Max 5 levels per roadmap
      dailyProfitTarget: parseFloat(dailyProfitTarget || 150),
      dailyStopLoss: parseFloat(dailyStopLoss || 200),
      maxTradesPerSession: parseInt(maxTradesPerSession || 20, 10),
      minBalanceProtection: parseFloat(minBalanceProtection || 100)
    };

    db.save();

    // Update active session risk parameters if running
    const activeSession = tradingEngine.activeSessions.get(userId);
    if (activeSession) {
      activeSession.riskSettings = riskMap[userId];
    }

    return res.json({ message: 'Risk & target settings saved!', riskSettings: riskMap[userId] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
