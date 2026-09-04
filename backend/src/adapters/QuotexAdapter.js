const BaseBrokerAdapter = require('./BaseBrokerAdapter');

class QuotexAdapter extends BaseBrokerAdapter {
  constructor() {
    super('quotex');
    this.mockBalance = 1450.50;
  }

  async connect(credentials) {
    if (!credentials) {
      throw new Error('Invalid Quotex credentials or session token.');
    }
    this.credentials = credentials;
    this.isConnected = true;
    const accountType = credentials.accountType || 'LIVE';
    this.mockBalance = credentials.balance || (accountType === 'DEMO' ? 10000.00 : 1450.50);

    return {
      success: true,
      broker: 'quotex',
      accountType,
      accountId: credentials.accountId || `QX-${accountType}-${Math.floor(100000 + Math.random() * 900000)}`,
      email: credentials.email || 'alex@quotex.com',
      balance: this.mockBalance,
      connectedAt: new Date().toISOString()
    };
  }

  async getBalance() {
    return this.mockBalance;
  }

  async getAssetQuotes() {
    return [
      { asset: 'EUR/USD (OTC)', payout: 88, price: 1.08450 + (Math.random() * 0.0004 - 0.0002) },
      { asset: 'GBP/USD (OTC)', payout: 87, price: 1.26810 + (Math.random() * 0.0004 - 0.0002) },
      { asset: 'USD/JPY (OTC)', payout: 85, price: 154.20 + (Math.random() * 0.04 - 0.02) },
      { asset: 'AUD/CAD (OTC)', payout: 86, price: 0.9120 + (Math.random() * 0.0004 - 0.0002) },
      { asset: 'BTC/USD', payout: 90, price: 65400 + (Math.random() * 50 - 25) }
    ];
  }

  async executeTrade({ asset, direction, amount, durationSeconds = 60 }) {
    if (!this.isConnected) {
      throw new Error('Quotex broker account is disconnected.');
    }
    if (amount > this.mockBalance) {
      throw new Error('Insufficient Quotex balance.');
    }

    const quotes = await this.getAssetQuotes();
    const currentAsset = quotes.find(q => q.asset === asset) || quotes[0];
    const entryPrice = parseFloat(currentAsset.price.toFixed(5));

    // Simulate 78% win probability for demonstration
    const isWin = Math.random() < 0.78;
    const priceDelta = (Math.random() * 0.0005 + 0.0001) * (direction === 'CALL' ? (isWin ? 1 : -1) : (isWin ? -1 : 1));
    const exitPrice = parseFloat((entryPrice + priceDelta).toFixed(5));
    const payout = currentAsset.payout / 100;

    let profitLoss = 0;
    let result = 'LOSS';

    if (isWin) {
      result = 'WIN';
      profitLoss = parseFloat((amount * payout).toFixed(2));
      this.mockBalance += profitLoss;
    } else {
      result = 'LOSS';
      profitLoss = -amount;
      this.mockBalance -= amount;
    }

    return {
      tradeId: `QX-TRD-${Math.floor(1000 + Math.random() * 9000)}`,
      broker: 'quotex',
      asset: currentAsset.asset,
      direction,
      amount,
      entryPrice,
      exitPrice,
      result,
      profitLoss,
      updatedBalance: parseFloat(this.mockBalance.toFixed(2)),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = QuotexAdapter;
