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
      trialStartedAt: new Date().toISOString(),
      subscriptionPlan: 'Premium Plan',
      subExpiresAt: '2099-12-31T23:59:59.000Z',
      isLifetimeApproved: true,
      referralUid: 'REF-MASTER-001',
      depositVerified: true,
      createdAt: new Date().toISOString()
    },
    {
      id: 'user-demo-1',
      name: 'Trader Alex',
      email: 'alex@qxautotrade.com',
      passwordHash: '$2a$10$w8T06o3Y0H1KjJ0z4l2a2.0A/Wc9hFq7y1D9e8g7f6e5d4c3b2a1', // password: password123
      role: 'USER',
      isActive: true,
      trialStartedAt: new Date().toISOString(),
      subscriptionPlan: 'Pro Plan',
      subExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isLifetimeApproved: false,
      referralUid: 'REF-ALEX-882',
      depositVerified: true,
      createdAt: new Date().toISOString()
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

class Database {
  constructor() {
    this.data = defaultData;
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(path.dirname(DB_FILE))) {
        fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
        // Ensure new tables are initialized if missing from existing JSON
        if (!this.data.userNotifications) this.data.userNotifications = defaultData.userNotifications;
        if (!this.data.userSecurity) this.data.userSecurity = defaultData.userSecurity;
        if (!this.data.errorLogs) this.data.errorLogs = [];
        if (!this.data.systemConfig) this.data.systemConfig = defaultData.systemConfig;
        if (!this.data.siteConfig) this.data.siteConfig = defaultData.siteConfig;
        if (!this.data.planSubscriptions) this.data.planSubscriptions = [];
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
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error loading database file, fallback to default:', err.message);
      // If db.json exists, do not immediately overwrite with defaultData
      this.data = defaultData;
    }
  }

  save() {
    try {
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      // Fallback direct write
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
      } catch (e) {
        console.error('Failed to save database:', e.message);
      }
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
