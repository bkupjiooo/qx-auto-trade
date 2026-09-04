const BaseBrokerAdapter = require('./BaseBrokerAdapter');

class GuruTrade7Adapter extends BaseBrokerAdapter {
  constructor() {
    super('gurutrade7');
    this.mockBalance = 5000.00;
  }

  async connect(credentials) {
    this.credentials = credentials;
    this.isConnected = true;
    return {
      success: true,
      broker: 'gurutrade7',
      accountId: credentials.accountId || `GT7-${Math.floor(10000 + Math.random() * 90000)}`,
      balance: this.mockBalance,
      connectedAt: new Date().toISOString()
    };
  }

  async getBalance() {
    return this.mockBalance;
  }

  async getAssetQuotes() {
    return [
      { asset: 'BRENT', payout: 84, price: 82.40 + (Math.random() * 0.2 - 0.1) },
      { asset: 'EUR/USD', payout: 80, price: 1.08450 + (Math.random() * 0.0004 - 0.0002) },
      { asset: 'SILVER', payout: 78, price: 28.50 + (Math.random() * 0.1 - 0.05) }
    ];
  }

  async executeTrade({ asset, direction, amount, durationSeconds = 60 }) {
    if (!this.isConnected) throw new Error('GuruTrade7 account disconnected.');
    const quotes = await this.getAssetQuotes();
    const currentAsset = quotes.find(q => q.asset === asset) || quotes[0];
    const entryPrice = parseFloat(currentAsset.price.toFixed(2));
    const isWin = Math.random() < 0.74;
    const exitPrice = parseFloat((entryPrice + (isWin ? 0.4 : -0.4) * (direction === 'CALL' ? 1 : -1)).toFixed(2));
    const payout = currentAsset.payout / 100;

    let profitLoss = isWin ? parseFloat((amount * payout).toFixed(2)) : -amount;
    let result = isWin ? 'WIN' : 'LOSS';
    this.mockBalance += profitLoss;

    return {
      tradeId: `GT7-TRD-${Math.floor(1000 + Math.random() * 9000)}`,
      broker: 'gurutrade7',
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

module.exports = GuruTrade7Adapter;
