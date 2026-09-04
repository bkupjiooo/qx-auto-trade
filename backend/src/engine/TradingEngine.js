const db = require('../database/db');
const brokerFactory = require('../adapters/BrokerFactory');

class TradingEngine {
  constructor() {
    this.activeSessions = new Map(); // userId -> session data
    this.wsBroadcaster = null;
    this.timerInterval = null;
    this.startEngineLoop();
  }

  setBroadcaster(broadcaster) {
    this.wsBroadcaster = broadcaster;
  }

  getSession(userId) {
    return this.activeSessions.get(userId) || {
      userId,
      status: 'IDLE', // IDLE, RUNNING, PAUSED, STOPPED
      broker: null,
      strategyId: null,
      accountType: 'DEMO',
      sessionWins: 0,
      sessionLosses: 0,
      currentProfitLoss: 0,
      currentMtgLevel: 1,
      totalTradesCount: 0,
      consecutiveLosses: 0,
      startedAt: null,
      lastTradeTime: 0
    };
  }

  startSession(userId, { broker, strategyId, accountType = 'DEMO' }) {
    const systemConfig = db.get('systemConfig');
    if (systemConfig.maintenanceMode) {
      throw new Error('System is currently under scheduled Maintenance Mode. Trading is temporarily paused.');
    }
    if (systemConfig.globalEmergencyStop) {
      throw new Error('Global Emergency Stop is active! Trading is currently halted by Master Admin.');
    }

    const users = db.get('users');
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found.');
    if (user.isActive === false) throw new Error('User account is deactivated. Contact Master Admin.');

    // Subscription & Free Trial Check
    const isTrialActive = this.checkFreeTrialActive(user);
    const isSubActive = user.subExpiresAt && new Date(user.subExpiresAt) > new Date();
    if (!isTrialActive && !isSubActive && !user.isLifetimeApproved) {
      throw new Error('Subscription expired. Please subscribe or verify referral lifetime access to resume trading.');
    }

    // Risk parameters check
    const riskSettings = db.get('riskSettings')[userId] || {
      mode: 'MTG',
      amountType: 'FIXED',
      fixedAmount: 20,
      percentageAmount: 2.0,
      mtgMultiplier: 2.1,
      maxMtgLevel: 5,
      dailyProfitTarget: 150,
      dailyStopLoss: 200,
      maxTradesPerSession: 20,
      maxConsecutiveLosses: 3,
      minBalanceProtection: 100
    };

    const session = {
      userId,
      status: 'RUNNING',
      broker,
      strategyId,
      accountType,
      sessionWins: 0,
      sessionLosses: 0,
      currentProfitLoss: 0,
      currentMtgLevel: 1,
      totalTradesCount: 0,
      consecutiveLosses: 0,
      startedAt: new Date().toISOString(),
      lastTradeTime: 0,
      riskSettings
    };

    this.activeSessions.set(userId, session);
    this.broadcastSessionUpdate(userId);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'SESSION_STARTED',
      actorEmail: user.email,
      details: `Started trading session on ${broker.toUpperCase()} (${accountType}) with Strategy ID ${strategyId}`,
      timestamp: new Date().toISOString()
    });
    db.save();

    return session;
  }

  pauseSession(userId) {
    const session = this.activeSessions.get(userId);
    if (session) {
      session.status = 'PAUSED';
      this.broadcastSessionUpdate(userId);
    }
    return session;
  }

  resumeSession(userId) {
    const session = this.activeSessions.get(userId);
    if (session) {
      session.status = 'RUNNING';
      this.broadcastSessionUpdate(userId);
    }
    return session;
  }

  stopSession(userId, reason = 'User requested stop') {
    const session = this.activeSessions.get(userId);
    if (session) {
      session.status = 'STOPPED';
      session.stopReason = reason;
      this.broadcastSessionUpdate(userId);
    }
    return session;
  }

  // Force stop single user's bot from Master Admin
  forceStopUserBot(userId, adminEmail = 'Master Admin') {
    const session = this.activeSessions.get(userId);
    if (session) {
      session.status = 'STOPPED';
      session.stopReason = 'Force-Stopped by Master Admin';
      this.broadcastSessionUpdate(userId);
    }
    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'SINGLE_BOT_FORCE_STOP',
      actorEmail: adminEmail,
      targetUserId: userId,
      details: `Master Admin force stopped bot session for user ${userId}`,
      timestamp: new Date().toISOString()
    });
    db.save();
    return session;
  }

  emergencyStopAll(adminEmail) {
    const systemConfig = db.get('systemConfig');
    systemConfig.globalEmergencyStop = true;
    systemConfig.updatedAt = new Date().toISOString();
    db.set('systemConfig', systemConfig);

    for (const [userId, session] of this.activeSessions.entries()) {
      session.status = 'STOPPED';
      session.stopReason = 'Emergency Master Admin Shutdown';
      this.broadcastSessionUpdate(userId);
    }

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'GLOBAL_EMERGENCY_STOP',
      actorEmail: adminEmail || 'Master Admin',
      details: 'Triggered global emergency stop for all active bots.',
      timestamp: new Date().toISOString()
    });
    db.save();

    if (this.wsBroadcaster) {
      this.wsBroadcaster({
        type: 'GLOBAL_EMERGENCY_STOP',
        message: 'Master Admin has activated Emergency Global Stop! All active trading sessions halted.'
      });
    }
  }

  clearEmergencyStop(adminEmail) {
    const systemConfig = db.get('systemConfig');
    systemConfig.globalEmergencyStop = false;
    systemConfig.updatedAt = new Date().toISOString();
    db.set('systemConfig', systemConfig);

    db.get('auditLogs').unshift({
      id: `audit-${Date.now()}`,
      action: 'CLEAR_EMERGENCY_STOP',
      actorEmail: adminEmail || 'Master Admin',
      details: 'Cleared global emergency stop.',
      timestamp: new Date().toISOString()
    });
    db.save();
  }

  checkFreeTrialActive(user) {
    if (!user.trialStartedAt) return false;
    const trialStart = new Date(user.trialStartedAt).getTime();
    const oneHour = 60 * 60 * 1000;
    return (Date.now() - trialStart) < oneHour;
  }

  startEngineLoop() {
    this.timerInterval = setInterval(() => {
      this.evaluateActiveSessions();
    }, 4000); // Check setups every 4 seconds
  }

  async evaluateActiveSessions() {
    const systemConfig = db.get('systemConfig');
    if (systemConfig.globalEmergencyStop || systemConfig.maintenanceMode) return;

    for (const [userId, session] of this.activeSessions.entries()) {
      if (session.status !== 'RUNNING') continue;

      try {
        await this.processSessionTick(session);
      } catch (err) {
        console.error(`Session tick error for user ${userId}:`, err.message);
      }
    }
  }

  async processSessionTick(session) {
    const now = Date.now();

    // Rate Limit Guard: Minimum 6 seconds between trade placements
    if (now - session.lastTradeTime < 6000) return;

    const risk = session.riskSettings;
    const adapter = brokerFactory.getAdapter(session.userId, session.broker);

    // Auto Safety 1: Check balance
    const currentBalance = await adapter.getBalance();
    if (currentBalance <= 0 || currentBalance < risk.minBalanceProtection) {
      this.stopSession(session.userId, `Balance ($${currentBalance.toFixed(2)}) reached minimum safety threshold ($${risk.minBalanceProtection}). Auto-stopped.`);
      return;
    }

    // Auto Safety 2: Daily Profit Target & Daily Stop Loss
    if (session.currentProfitLoss >= risk.dailyProfitTarget) {
      this.stopSession(session.userId, `Target profit ($${risk.dailyProfitTarget}) hit! Auto-stopped session.`);
      return;
    }
    if (session.currentProfitLoss <= -risk.dailyStopLoss) {
      this.stopSession(session.userId, `Daily stop loss (-$${risk.dailyStopLoss}) hit! Auto-stopped session.`);
      return;
    }

    // Auto Safety 3: Max Trades per session limit
    if (session.totalTradesCount >= risk.maxTradesPerSession) {
      this.stopSession(session.userId, `Max trades limit (${risk.maxTradesPerSession}) reached! Auto-stopped session.`);
      return;
    }

    // Auto Safety 4: Max Consecutive Losses limit
    if (risk.maxConsecutiveLosses && session.consecutiveLosses >= risk.maxConsecutiveLosses) {
      this.stopSession(session.userId, `Maximum consecutive losses limit (${risk.maxConsecutiveLosses}) reached. Auto-stopped session.`);
      return;
    }

    // Calculate base trade amount based on FIXED vs PERCENTAGE mode
    let baseTradeAmount = risk.fixedAmount || 20;
    if (risk.amountType === 'PERCENTAGE') {
      baseTradeAmount = (currentBalance * (risk.percentageAmount || 2.0)) / 100;
    }

    let tradeAmount = baseTradeAmount;
    if (risk.mode === 'MTG') {
      tradeAmount = baseTradeAmount * Math.pow(risk.mtgMultiplier, session.currentMtgLevel - 1);
    }
    tradeAmount = parseFloat(tradeAmount.toFixed(2));

    if (tradeAmount > currentBalance) {
      this.stopSession(session.userId, `Required trade amount ($${tradeAmount}) exceeds current balance ($${currentBalance.toFixed(2)}). Auto-stopped.`);
      return;
    }

    // Strategy signal evaluation
    const strategies = db.get('strategies');
    const strategy = strategies.find(s => s.id === session.strategyId) || strategies[0];

    // Trigger signal with 45% probability on tick
    const hasSignal = Math.random() < 0.45;
    if (!hasSignal) return;

    const assetQuotes = await adapter.getAssetQuotes();
    const chosenAsset = assetQuotes[Math.floor(Math.random() * assetQuotes.length)];
    const direction = Math.random() > 0.5 ? 'CALL' : 'PUT';

    // Execute trade via Broker Adapter
    session.lastTradeTime = now;
    const result = await adapter.executeTrade({
      asset: chosenAsset.asset,
      direction,
      amount: tradeAmount,
      durationSeconds: 60
    });

    // Update Session Metrics & MTG Logic
    session.totalTradesCount += 1;
    session.currentProfitLoss += result.profitLoss;

    if (result.result === 'WIN') {
      session.sessionWins += 1;
      session.consecutiveLosses = 0;
      session.currentMtgLevel = 1; // Reset MTG to Level 1 on win!
    } else if (result.result === 'LOSS') {
      session.sessionLosses += 1;
      session.consecutiveLosses += 1;

      if (risk.mode === 'MTG') {
        if (session.currentMtgLevel >= risk.maxMtgLevel) {
          // Auto Safety Rule: MTG Level 5 Loss automatically stops session!
          this.stopSession(session.userId, `MTG Level ${risk.maxMtgLevel} loss incurred. Maximum Martingale safety limit reached. Session auto-stopped.`);
          session.currentMtgLevel = 1;
        } else {
          session.currentMtgLevel += 1; // Step up to next MTG level
        }
      }
    }

    // Record Trade Log to Database
    const newTradeLog = {
      id: result.tradeId,
      userId: session.userId,
      broker: session.broker,
      asset: result.asset,
      direction: result.direction,
      amount: result.amount,
      entryPrice: result.entryPrice,
      exitPrice: result.exitPrice,
      result: result.result,
      profitLoss: result.profitLoss,
      strategyName: strategy.name,
      mtgLevel: session.riskSettings.mode === 'MTG' ? (result.result === 'WIN' ? session.currentMtgLevel : session.currentMtgLevel - 1 || 1) : 1,
      refId: `REF-${Date.now()}`,
      timestamp: result.timestamp
    };

    db.get('tradeLogs').unshift(newTradeLog);
    db.save();

    // Broadcast WebSocket Trade Event
    this.broadcastTradeEvent(session.userId, newTradeLog, session);
  }

  broadcastSessionUpdate(userId) {
    if (this.wsBroadcaster) {
      const session = this.getSession(userId);
      this.wsBroadcaster({
        type: 'SESSION_UPDATE',
        userId,
        session
      });
    }
  }

  broadcastTradeEvent(userId, tradeLog, session) {
    if (this.wsBroadcaster) {
      this.wsBroadcaster({
        type: 'TRADE_EXECUTED',
        userId,
        tradeLog,
        session
      });
    }
  }
}

module.exports = new TradingEngine();
