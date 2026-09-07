const { WebSocketServer } = require('ws');
const tradingEngine = require('../engine/TradingEngine');

function setupWebSocketServer(server) {
  const wss = new WebSocketServer({ server });
  const clients = new Set();

  wss.on('connection', (ws) => {
    clients.add(ws);

    ws.send(JSON.stringify({
      type: 'CONNECTED',
      message: 'Connected to QX Auto Trade Real-Time WebSocket Server'
    }));

    ws.on('message', (data) => {
      try {
        const payload = JSON.parse(data);
        if (payload.type === 'SUBSCRIBE_USER') {
          ws.userId = payload.userId;
          const session = tradingEngine.getSession(payload.userId);
          ws.send(JSON.stringify({
            type: 'SESSION_UPDATE',
            userId: payload.userId,
            session
          }));
        }
      } catch (err) {
        console.error('WS parse error:', err.message);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
    });
  });

  // Attach broadcaster function to TradingEngine
  tradingEngine.setBroadcaster((data) => {
    const jsonStr = JSON.stringify(data);
    for (const client of clients) {
      if (client.readyState === 1) { // OPEN
        if (!data.userId || client.userId === data.userId || data.type === 'GLOBAL_EMERGENCY_STOP') {
          client.send(jsonStr);
        }
      }
    }
  });

  return wss;
}

module.exports = setupWebSocketServer;
