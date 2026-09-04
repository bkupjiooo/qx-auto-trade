const BaseBrokerAdapter = require('./BaseBrokerAdapter');

class PocketOptionAdapter extends BaseBrokerAdapter {
  constructor() {
    super('pocketoption');
    this.mockBalance = 10000.00;
  }

  async connect(credentials) {
    this.credentials = credentials;
    this.isConnected = true;
    return {
      success: true,
      broker: 'pocketoption',
      accountId: credentials.accountId || `PO-DEMO-${Math.floor(10000 + Math.random() * 90000)}`,
      balance: this.mockBalance,
      connectedAt: new Date().toISOString()
    };
  }

  async getBalance() {
    return this.mockBalance;
  }

  async getAssetQuotes() {
    return [
      { asset: 'EUR/USD', payout: 92, price: 1.08450 + (Math.random() * 0.0004 - 0.0002) },
      { asset: 'GBP/JPY', payout: 89, price: 195.40 + (Math.random() * 0.05 - 0.025) },
      { asset: 'AUD/USD', payout: 88, price: 0.6550 + (Math.random() * 0.0004 - 0.0002) },
      { asset: 'ETH/USD', payout: 85, price: 3450 + (Math.random() * 5 - 2.5) }
    ];
  }

  async executeTrade({ asset, direction, amount, durationSeconds = 60 }) {
    if (!this.isConnected) throw new Error('Pocket Option account disconnected.');
    const quotes = await this.getAssetQuotes();
    const currentAsset = quotes.find(q => q.asset === asset) || quotes[0];
    const entryPrice = parseFloat(currentAsset.price.toFixed(5));
    const isWin = Math.random() < 0.75;
    const exitPrice = parseFloat((entryPrice + (isWin ? 0.0003 : -0.0003) * (direction === 'CALL' ? 1 : -1)).toFixed(5));
    const payout = currentAsset.payout / 100;

    let profitLoss = isWin ? parseFloat((amount * payout).toFixed(2)) : -amount;
    let result = isWin ? 'WIN' : 'LOSS';
    this.mockBalance += profitLoss;

    return {
      tradeId: `PO-TRD-${Math.floor(1000 + Math.random() * 9000)}`,
      broker: 'pocketoption',
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

module.exports = PocketOptionAdapter;
