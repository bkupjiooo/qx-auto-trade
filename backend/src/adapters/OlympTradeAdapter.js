const BaseBrokerAdapter = require('./BaseBrokerAdapter');

class OlympTradeAdapter extends BaseBrokerAdapter {
  constructor() {
    super('olymptrade');
    this.mockBalance = 2500.00;
  }

  async connect(credentials) {
    this.credentials = credentials;
    this.isConnected = true;
    return {
      success: true,
      broker: 'olymptrade',
      accountId: credentials.accountId || `OT-LIVE-${Math.floor(10000 + Math.random() * 90000)}`,
      balance: this.mockBalance,
      connectedAt: new Date().toISOString()
    };
  }

  async getBalance() {
    return this.mockBalance;
  }

  async getAssetQuotes() {
    return [
      { asset: 'Asia Composite Index', payout: 85, price: 6240.50 + (Math.random() * 2 - 1) },
      { asset: 'EUR/USD', payout: 82, price: 1.08450 + (Math.random() * 0.0004 - 0.0002) },
      { asset: 'Gold', payout: 80, price: 2380.00 + (Math.random() * 1.5 - 0.75) }
    ];
  }

  async executeTrade({ asset, direction, amount, durationSeconds = 60 }) {
    if (!this.isConnected) throw new Error('Olymp Trade account disconnected.');
    const quotes = await this.getAssetQuotes();
    const currentAsset = quotes.find(q => q.asset === asset) || quotes[0];
    const entryPrice = parseFloat(currentAsset.price.toFixed(2));
    const isWin = Math.random() < 0.76;
    const exitPrice = parseFloat((entryPrice + (isWin ? 1.2 : -1.2) * (direction === 'CALL' ? 1 : -1)).toFixed(2));
    const payout = currentAsset.payout / 100;

    let profitLoss = isWin ? parseFloat((amount * payout).toFixed(2)) : -amount;
    let result = isWin ? 'WIN' : 'LOSS';
    this.mockBalance += profitLoss;

    return {
      tradeId: `OT-TRD-${Math.floor(1000 + Math.random() * 9000)}`,
      broker: 'olymptrade',
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

module.exports = OlympTradeAdapter;
