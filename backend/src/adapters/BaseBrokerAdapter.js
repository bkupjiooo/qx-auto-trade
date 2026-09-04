class BaseBrokerAdapter {
  constructor(brokerName) {
    this.brokerName = brokerName;
    this.isConnected = false;
    this.credentials = null;
  }

  async connect(credentials) {
    throw new Error('connect() must be implemented by subclass');
  }

  async disconnect() {
    this.isConnected = false;
    this.credentials = null;
    return true;
  }

  async getBalance() {
    throw new Error('getBalance() must be implemented by subclass');
  }

  async executeTrade({ asset, direction, amount, durationSeconds }) {
    throw new Error('executeTrade() must be implemented by subclass');
  }

  async getAssetQuotes() {
    throw new Error('getAssetQuotes() must be implemented by subclass');
  }
}

module.exports = BaseBrokerAdapter;
