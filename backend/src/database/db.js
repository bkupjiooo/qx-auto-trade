const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'db.json');

const defaultData = {
  users: [
    {
      id: 'admin-1',
      name: 'Master Admin',
      email: 'admin@qxautotrade.com',
      passwordHash: '$2a$10$w8T06o3Y0H1KjJ0z4l2a2.0A/Wc9hFq7y1D9e8g7f6e5d4c3b2a1', // password: admin123
      role: 'MASTER_ADMIN',
      isActive: true,
      trialStartedAt: '2026-07-29T19:04:24.670Z',
      subscriptionPlan: 'Premium Plan',
      subExpiresAt: '2099-12-31T23:59:59.000Z',
      isLifetimeApproved: true,
      referralUid: 'REF-MASTER-001',
      depositVerified: true,
      createdAt: '2026-07-29T19:04:24.671Z'
    },
    {
      id: 'user-1788612470060',
      name: 'Om',
      email: 'omchoubey123@gmail.com',
      passwordHash: '$2a$10$w8T06o3Y0H1KjJ0z4l2a2.0A/Wc9hFq7y1D9e8g7f6e5d4c3b2a1',
      role: 'USER',
      isActive: true,
      subscriptionPlan: 'Premium Plan (Lifetime)',
      subExpiresAt: '2099-12-31T23:59:59.000Z',
      planExpiresAt: '2099-12-31T23:59:59.000Z',
      isLifetimeApproved: true,
      depositVerified: true,
      createdAt: '2026-09-05T12:47:50.060Z'
    },
    {
      id: 'user-demo-1',
      name: 'Trader Alex',
      email: 'alex@qxautotrade.com',
      passwordHash: '$2a$10$w8T06o3Y0H1KjJ0z4l2a2.0A/Wc9hFq7y1D9e8g7f6e5d4c3b2a1', // password: password123
      role: 'USER',
      isActive: true,
      trialStartedAt: '2026-07-29T19:04:24.670Z',
      subscriptionPlan: 'Pro Plan',
      subExpiresAt: '2027-01-01T00:00:00.000Z',
      isLifetimeApproved: false,
      referralUid: 'REF-ALEX-882',
      depositVerified: true,
      createdAt: '2026-07-29T19:04:24.671Z'
    },
    {
      id: 'user-1785352926977',
      name: 'Sarah Trade',
      email: 'sarah@qxautotrade.com',
      passwordHash: '$2a$10$w8T06o3Y0H1KjJ0z4l2a2.0A/Wc9hFq7y1D9e8g7f6e5d4c3b2a1',
      role: 'USER',
      isActive: true,
      subscriptionPlan: 'Pro Plan',
      subExpiresAt: '2027-01-01T00:00:00.000Z',
      isLifetimeApproved: false,
      depositVerified: true,
      createdAt: '2026-08-01T10:00:00.000Z'
    },
    {
      id: 'user-1',
      name: 'Quotex Trader',
      email: 'quotex_trader@qxbroker.com',
      passwordHash: '$2a$10$w8T06o3Y0H1KjJ0z4l2a2.0A/Wc9hFq7y1D9e8g7f6e5d4c3b2a1',
      role: 'USER',
      isActive: true,
      subscriptionPlan: 'Basic Plan',
      subExpiresAt: '2027-01-01T00:00:00.000Z',
      isLifetimeApproved: false,
      depositVerified: true,
      createdAt: '2026-08-03T11:21:50.902Z'
    },
    {
      id: 'user-1787424851409',
      name: 'Demo User',
      email: 'demo@qxautotrade.com',
      passwordHash: '$2a$10$w8T06o3Y0H1KjJ0z4l2a2.0A/Wc9hFq7y1D9e8g7f6e5d4c3b2a1',
      role: 'USER',
      isActive: true,
      subscriptionPlan: 'Free Trial',
      subExpiresAt: '2027-01-01T00:00:00.000Z',
      isLifetimeApproved: false,
      depositVerified: false,
      createdAt: '2026-08-23T11:58:02.204Z'
    },
    {
      id: 'user-1787485286368',
      name: 'Test OTP',
      email: 'otp-test@qx.com',
      passwordHash: '$2a$10$w8T06o3Y0H1KjJ0z4l2a2.0A/Wc9hFq7y1D9e8g7f6e5d4c3b2a1',
      role: 'USER',
      isActive: true,
      subscriptionPlan: 'Free Trial',
      subExpiresAt: '2027-01-01T00:00:00.000Z',
      isLifetimeApproved: false,
      depositVerified: false,
      createdAt: '2026-08-23T11:41:26.368Z'
    }
  ],
  brokerConnections: [
    {
      id: 'conn-1',
      userId: 'user-demo-1',
      broker: 'quotex',
      accountType: 'LIVE',
      accountId: 'QX-LIVE-884912',
      encryptedToken: 'enc_token_qx_884912',
      balance: 1450.50,
      isConnected: true,
      connectedAt: new Date().toISOString()
    },
    {
      id: 'conn-2',
      userId: 'user-demo-1',
      broker: 'pocketoption',
      accountType: 'DEMO',
      accountId: 'PO-DEMO-99102',
      encryptedToken: 'enc_token_po_99102',
      balance: 10000.00,
      isConnected: true,
      connectedAt: new Date().toISOString()
    }
  ],
  strategies: [
    {
      id: 'strat-1',
      name: 'OTC Volatility Scalper Pro v3',
      broker: 'quotex',
      winRate: 88.5,
      timeframe: '1M',
      indicatorSummary: 'RSI(14) Oversold + EMA(9/21) Crossover + Bollinger Squeeze',
      parameters: { rsiPeriod: 14, rsiOversold: 30, rsiOverbought: 70, emaFast: 9, emaSlow: 21, bollingerMult: 2.0 },
      description: 'High-frequency binary option scalping setup designed for fast OTC and volatility pairs.',
      isActive: true,
      createdBy: 'Master Admin'
    },
    {
      id: 'strat-2',
      name: 'Trend Rider Momentum Pro',
      broker: 'quotex',
      winRate: 91.2,
      timeframe: '5M',
      indicatorSummary: 'MACD Zero-lag + SuperTrend (10,3) + Stochastic RSI',
      parameters: { macdFast: 12, macdSlow: 26, macdSignal: 9, supertrendPeriod: 10, supertrendMult: 3.0 },
      description: 'Momentum trend-following algorithm for strong directional market continuation.',
      isActive: true,
      createdBy: 'Master Admin'
    },
    {
      id: 'strat-3',
      name: 'Price Action Reversal Master',
      broker: 'quotex',
      winRate: 86.4,
      timeframe: '1M',
      indicatorSummary: 'Pivot Point Reversal + Parabolic SAR + Volume Surge',
      parameters: { sarStart: 0.02, sarIncrement: 0.02, sarMax: 0.2 },
      description: 'Dynamic mean-reversion algorithm targeting sharp market turning points & price bounces.',
      isActive: true,
      createdBy: 'Master Admin'
    },
    {
      id: 'strat-4',
      name: 'Smart Breakout & Volatility Engine',
      broker: 'quotex',
      winRate: 84.0,
      timeframe: '2M',
      indicatorSummary: 'Support/Resistance Breakout + ADX > 25',
      parameters: { adxThreshold: 25, lookbackBars: 20 },
      description: 'High-volatility support & resistance breakout detector for rapid price expansions.',
      isActive: true,
      createdBy: 'Master Admin'
    }
  ],
  riskSettings: {
    'user-demo-1': {
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
    }
  },
  userNotifications: {
    'user-demo-1': {
      webPush: true,
      mobilePush: true,
      email: true,
      telegram: true,
      telegramChatId: '@trader_alex_bot',
      tradePlaced: true,
      winLoss: true,
      targetHit: true,
      stopLossHit: true,
      brokerDisconnect: true,
      lowBalance: true,
      subExpiry: true,
      newDeviceLogin: true
    }
  },
  userSecurity: {
    'user-demo-1': {
      is2FAEnabled: false,
      twoFASecret: 'QX-2FA-SECRET-99812',
      loginHistory: [
        { id: 'log-1', ip: '192.168.1.45', device: 'Chrome on Windows 11', location: 'New York, USA', timestamp: new Date(Date.now() - 3600000).toISOString() }
      ],
      suspiciousAlerts: []
    }
  },
  tradeLogs: [
    {
      id: 'trade-101',
      userId: 'user-demo-1',
      broker: 'quotex',
      asset: 'EUR/USD (OTC)',
      direction: 'CALL',
      amount: 20.00,
      entryPrice: 1.08450,
      exitPrice: 1.08485,
      result: 'WIN',
      profitLoss: 17.60,
      strategyName: 'Quotex OTC Volatility Scalper v3',
      mtgLevel: 1,
      refId: 'QX-TRD-9001',
      timestamp: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  referralRequests: [],
  planSubscriptions: [],
  errorLogs: [],
  auditLogs: [],
  announcements: [],
  subscriptionPlans: [
    {
      id: 'plan-basic',
      name: 'Basic Plan',
      price: '$49',
      numericPrice: 49,
      period: '/month',
      features: ['All trading strategies', '1 broker connection', 'Email support', '2 currency pairs', 'Daily reports'],
      icon: 'Zap',
      isActive: true,
      popular: false,
      cta: 'Get Started'
    },
    {
      id: 'plan-pro',
      name: 'Pro Plan',
      price: '$129',
      numericPrice: 129,
      period: '/3 months',
      features: ['5 trading bots', 'Advanced strategies', 'Priority support', '10 currency pairs', 'Real-time analytics', 'Custom indicators'],
      icon: 'Star',
      isActive: true,
      popular: true,
      cta: 'Start Pro'
    },
    {
      id: 'plan-quantum',
      name: 'Quantum Plan',
      price: '$239',
      numericPrice: 239,
      period: '/6 months',
      features: ['Everything in Pro', '10 broker connections', 'Custom strategies', 'API access', 'Dedicated support'],
      icon: 'Zap',
      isActive: true,
      popular: false,
      cta: 'Choose Quantum'
    },
    {
      id: 'plan-premium',
      name: 'Premium Plan (Lifetime)',
      price: '$450',
      numericPrice: 450,
      period: '/12 months',
      features: ['Unlimited bots', 'All strategies', 'Dedicated 24/7 support', 'All currency pairs', 'Advanced analytics', 'VIP community access'],
      icon: 'Crown',
      isActive: true,
      popular: false,
      cta: 'Go Premium'
    }
  ],
  siteConfig: {
    telegramLink: 'https://t.me/quotexautotrade_official',
    telegramSupport: 'https://t.me/quotexautotrade_official',
    supportEmail: 'support@quotexautotrade.com',
    instagramLink: 'https://instagram.com/quotexautotrade',
    youtubeLink: 'https://youtube.com/c/quotexautotrade',
    youtubeEmbedCode: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    referralLink: 'https://quotex.com/ref/official',
    referralDepositAmount: 150,
    priceBasic: 49,
    pricePro: 129,
    priceQuantum: 239,
    pricePremium: 450,
    enableUPI: true,
    enableBankTransfer: true,
    enableUSDT: true,
    brokerLinks: {
      quotex: 'https://broker-qx.pro/sign-up/?lid=345678',
      pocketOption: 'https://pocketoption.com/register',
      binomo: 'https://binomo.com',
      olympTrade: 'https://olymptrade.com'
    },
    footerText: 'QUOTEX AUTO TRADE © 2026. All rights reserved.',
    paymentUsdt: 'TQUOTEXautoTradeAddress1234567890USDT',
    paymentUpi: 'quotexautotrade@upi',
    paymentBank: 'Bank: QUOTEX Trade Ltd | A/C: 9988776655 | IFSC: QXIN0001234',
    siteName: 'Auto Trade Bot',
    siteLogo: '',
    favicon: '',
    updatedAt: new Date().toISOString()
  },
  systemConfig: {
    maintenanceMode: false,
    globalEmergencyStop: false,
    updatedAt: new Date().toISOString()
  }
};

const USERS_REGISTRY_FILE = path.join(__dirname, 'users_registry.json');
const BACKUP_FILE = path.join(__dirname, 'db_users_backup.json');

class Database {
  constructor() {
    this.data = JSON.parse(JSON.stringify(defaultData));
    this.init();
  }

  // Merge multiple user arrays ensuring no user is ever lost or downgraded
  mergeUserLists(...lists) {
    const userMap = new Map();

    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (const u of list) {
        if (!u || (!u.id && !u.email)) continue;
        const key = (u.email ? u.email.toLowerCase().trim() : u.id);
        const existing = userMap.get(key) || (u.id ? userMap.get(u.id) : null);

        if (!existing) {
          userMap.set(key, { ...u });
          if (u.id) userMap.set(u.id, userMap.get(key));
        } else {
          // Merge smartly: preserve real names, paid plans, active status
          const isExistingPaid = existing.subscriptionPlan && existing.subscriptionPlan !== 'Free Trial';
          const isIncomingPaid = u.subscriptionPlan && u.subscriptionPlan !== 'Free Trial';
          const plan = isExistingPaid ? existing.subscriptionPlan : (isIncomingPaid ? u.subscriptionPlan : (existing.subscriptionPlan || u.subscriptionPlan || 'Free Trial'));
          const isLifetime = Boolean(existing.isLifetimeApproved || u.isLifetimeApproved);

          const merged = {
            ...existing,
            ...u,
            name: (u.name && !u.name.startsWith('Trader user-')) ? u.name : (existing.name || u.name || 'Trader'),
            email: (u.email && !u.email.includes('@trader.quotex')) ? u.email.toLowerCase() : (existing.email || u.email),
            subscriptionPlan: plan,
            isLifetimeApproved: isLifetime,
            isActive: existing.isActive !== undefined ? existing.isActive : (u.isActive !== undefined ? u.isActive : true),
            passwordHash: existing.passwordHash || u.passwordHash || defaultData.users[0].passwordHash,
            createdAt: existing.createdAt || u.createdAt || new Date().toISOString()
          };
          userMap.set(key, merged);
          if (merged.id) userMap.set(merged.id, merged);
        }
      }
    }

    // Return unique users array
    const seenIds = new Set();
    const uniqueUsers = [];
    for (const user of userMap.values()) {
      const uid = user.id || user.email;
      if (!seenIds.has(uid)) {
        seenIds.add(uid);
        uniqueUsers.push(user);
      }
    }
    return uniqueUsers;
  }

  init() {
    try {
      if (!fs.existsSync(path.dirname(DB_FILE))) {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      }

      let loadedUsers = [];

      // 1. Read primary DB_FILE if available
      if (fs.existsSync(DB_FILE)) {
        try {
          const fileContent = fs.readFileSync(DB_FILE, 'utf8');
          const parsed = JSON.parse(fileContent);
          this.data = parsed;
          if (Array.isArray(parsed.users)) loadedUsers.push(...parsed.users);
        } catch (e) {
          console.error('[DB] Primary file load warning:', e.message);
        }
      }

      // 2. Read USERS_REGISTRY_FILE if available
      if (fs.existsSync(USERS_REGISTRY_FILE)) {
        try {
          const regContent = fs.readFileSync(USERS_REGISTRY_FILE, 'utf8');
          const regParsed = JSON.parse(regContent);
          const regUsers = Array.isArray(regParsed) ? regParsed : (regParsed.users || []);
          loadedUsers.push(...regUsers);
        } catch (e) {
          console.error('[DB] Users registry load warning:', e.message);
        }
      }

      // 3. Read BACKUP_FILE if available
      if (fs.existsSync(BACKUP_FILE)) {
        try {
          const bkpContent = fs.readFileSync(BACKUP_FILE, 'utf8');
          const bkpParsed = JSON.parse(bkpContent);
          const bkpUsers = Array.isArray(bkpParsed) ? bkpParsed : (bkpParsed.users || []);
          loadedUsers.push(...bkpUsers);
        } catch (e) {
          console.error('[DB] Users backup load warning:', e.message);
        }
      }

      // Merge all users with defaultData so registered users are NEVER lost
      this.data.users = this.mergeUserLists(defaultData.users, loadedUsers, this.data.users || []);

      // Ensure critical tables exist
      if (!this.data.userNotifications) this.data.userNotifications = defaultData.userNotifications;
      if (!this.data.userSecurity) this.data.userSecurity = defaultData.userSecurity;
      if (!this.data.errorLogs) this.data.errorLogs = [];
      if (!this.data.systemConfig) this.data.systemConfig = defaultData.systemConfig;
      if (!this.data.siteConfig) this.data.siteConfig = defaultData.siteConfig;
      if (!this.data.planSubscriptions) this.data.planSubscriptions = [];
      if (!this.data.riskSettings) this.data.riskSettings = defaultData.riskSettings;
      if (!this.data.brokerConnections) this.data.brokerConnections = defaultData.brokerConnections;
      if (!this.data.strategies) this.data.strategies = defaultData.strategies;
      if (!this.data.tradeLogs) this.data.tradeLogs = defaultData.tradeLogs;
      if (!this.data.auditLogs) this.data.auditLogs = [];
      if (!this.data.subscriptionPlans || this.data.subscriptionPlans.length === 0) {
        this.data.subscriptionPlans = defaultData.subscriptionPlans;
      }
      if (this.data.siteConfig.priceBasic === undefined) this.data.siteConfig.priceBasic = 49;
      if (this.data.siteConfig.pricePro === undefined) this.data.siteConfig.pricePro = 129;
      if (this.data.siteConfig.priceQuantum === undefined) this.data.siteConfig.priceQuantum = 239;
      if (this.data.siteConfig.pricePremium === undefined) this.data.siteConfig.pricePremium = 450;
      if (this.data.siteConfig.enableUPI === undefined) this.data.siteConfig.enableUPI = true;
      if (this.data.siteConfig.enableBankTransfer === undefined) this.data.siteConfig.enableBankTransfer = true;
      if (this.data.siteConfig.enableUSDT === undefined) this.data.siteConfig.enableUSDT = true;
      if (!this.data.siteConfig.brokerLinks) this.data.siteConfig.brokerLinks = defaultData.siteConfig.brokerLinks;

      // Save merged snapshot to disk
      this.save();
      console.log(`[DB] Database initialized successfully. Total permanent users: ${this.data.users.length}`);
    } catch (err) {
      console.error('[DB] Error initializing database:', err.message);
      this.data.users = this.mergeUserLists(defaultData.users, this.data.users || []);
    }
  }

  save() {
    try {
      const jsonContent = JSON.stringify(this.data, null, 2);
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, jsonContent, 'utf8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
      } catch (e) {
        console.error('[DB] Failed to save DB_FILE:', e.message);
      }
    }

    // Always keep an updated users-only registry file & backup file
    try {
      const usersJson = JSON.stringify({ users: this.data.users, updatedAt: new Date().toISOString() }, null, 2);
      fs.writeFileSync(USERS_REGISTRY_FILE, usersJson, 'utf8');
      fs.writeFileSync(BACKUP_FILE, usersJson, 'utf8');
    } catch (e) {
      // Non-fatal
    }
  }

  // Safe Upsert user method: updates or inserts without losing user details
  upsertUser(userData) {
    if (!userData) return null;
    const users = this.get('users');
    const lookupId = userData.id;
    const lookupEmail = userData.email ? userData.email.toLowerCase().trim() : null;

    let index = users.findIndex(u => (lookupId && u.id === lookupId) || (lookupEmail && u.email && u.email.toLowerCase() === lookupEmail));

    if (index >= 0) {
      // User exists: update without downgrading plan or losing real email
      const existing = users[index];
      const isExistingPaid = existing.subscriptionPlan && existing.subscriptionPlan !== 'Free Trial';
      const isIncomingPaid = userData.subscriptionPlan && userData.subscriptionPlan !== 'Free Trial';
      const plan = isExistingPaid ? existing.subscriptionPlan : (isIncomingPaid ? userData.subscriptionPlan : existing.subscriptionPlan);

      users[index] = {
        ...existing,
        ...userData,
        name: (userData.name && !userData.name.startsWith('Trader user-')) ? userData.name : existing.name,
        email: (userData.email && !userData.email.includes('@trader.quotex')) ? userData.email.toLowerCase() : existing.email,
        subscriptionPlan: plan || 'Free Trial',
        isLifetimeApproved: Boolean(existing.isLifetimeApproved || userData.isLifetimeApproved),
        isActive: userData.isActive !== undefined ? userData.isActive : (existing.isActive !== undefined ? existing.isActive : true)
      };
      this.save();
      return users[index];
    } else {
      // User does not exist: create user
      const nowMs = Date.now();
      const newUser = {
        id: userData.id || `user-${nowMs}`,
        name: userData.name || 'Trader',
        email: (userData.email && !userData.email.includes('@trader.quotex')) ? userData.email.toLowerCase() : `${userData.id || nowMs}@trader.quotex`,
        role: userData.role || 'USER',
        subscriptionPlan: userData.subscriptionPlan || 'Free Trial',
        subExpiresAt: userData.subExpiresAt || new Date(nowMs + 60 * 60 * 1000).toISOString(),
        isLifetimeApproved: Boolean(userData.isLifetimeApproved),
        isActive: userData.isActive !== undefined ? userData.isActive : true,
        createdAt: userData.createdAt || new Date(nowMs).toISOString()
      };
      users.unshift(newUser);

      // Default risk settings if missing
      const riskSettings = this.get('riskSettings');
      if (!riskSettings[newUser.id]) {
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
      }
      this.save();
      return newUser;
    }
  }

  get(table) {
    if (!this.data[table]) {
      this.data[table] = defaultData[table] || (table.endsWith('s') ? [] : {});
    }
    return this.data[table];
  }

  set(table, value) {
    this.data[table] = value;
    this.save();
  }
}

module.exports = new Database();

