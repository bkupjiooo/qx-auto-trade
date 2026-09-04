const QuotexAdapter = require('./QuotexAdapter');
const PocketOptionAdapter = require('./PocketOptionAdapter');
const OlympTradeAdapter = require('./OlympTradeAdapter');
const GuruTrade7Adapter = require('./GuruTrade7Adapter');

class BrokerFactory {
  constructor() {
    this.instances = new Map();
  }

  getAdapter(userId, brokerName) {
    const key = `${userId}:${brokerName}`;
    if (!this.instances.has(key)) {
      let adapter;
      switch (brokerName.toLowerCase()) {
        case 'quotex':
          adapter = new QuotexAdapter();
          break;
        case 'pocketoption':
          adapter = new PocketOptionAdapter();
          break;
        case 'olymptrade':
          adapter = new OlympTradeAdapter();
          break;
        case 'gurutrade7':
          adapter = new GuruTrade7Adapter();
          break;
        default:
          throw new Error(`Unsupported broker platform: ${brokerName}`);
      }
      this.instances.set(key, adapter);
    }
    return this.instances.get(key);
  }
}

module.exports = new BrokerFactory();
