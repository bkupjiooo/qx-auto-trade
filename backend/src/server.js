const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const brokerRoutes = require('./routes/broker');
const strategyRoutes = require('./routes/strategy');
const tradingRoutes = require('./routes/trading');
const adminRoutes = require('./routes/admin');
const reportsRoutes = require('./routes/reports');
const userRoutes = require('./routes/user');
const setupWebSocketServer = require('./websocket/socketServer');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/broker', brokerRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'QX Auto Trade Backend & Execution Engine',
    version: '2.4.2',
    timestamp: new Date().toISOString()
  });
});

// Robust frontend dist directory detection for both local and production VPS
let frontendDist = path.join(__dirname, '../../frontend/dist');
if (!fs.existsSync(frontendDist)) {
  frontendDist = path.join(__dirname, '../../dist');
}
if (!fs.existsSync(frontendDist)) {
  frontendDist = path.join(__dirname, '../../public_html');
}

console.log(`[Static Files] Serving fresh frontend production build from: ${frontendDist}`);

const dashboardDist = path.join(frontendDist, 'dashboard-app');
const dashboardRoutes = ['/dashboard', '/strategies', '/settings', '/history', '/performance', '/subscriptions', '/support'];
const adminRoutes2 = ['/admin/login', '/admin/dashboard', '/admin/users', '/admin/strategies', '/admin/subscriptions', '/admin/plan-manager', '/admin/site-config', '/admin/announcements'];

// Serve dashboard static assets
app.use('/dashboard', express.static(dashboardDist));

// Explicit APK Download Route
app.get([
  '/Quotexautotrade.apk',
  '/downloads/Quotexautotrade.apk',
  '/downloads/Autotrade.apk',
  '/Autotrade.apk',
  '/downloads/qx-auto-trade.apk'
], (req, res) => {
  const candidates = [
    path.join(frontendDist, 'Quotexautotrade.apk'),
    path.join(__dirname, '../../Quotexautotrade.apk'),
    path.join(frontendDist, 'downloads/Autotrade.apk'),
    path.join(frontendDist, 'Autotrade.apk'),
    path.join(__dirname, '../../frontend/dist/Quotexautotrade.apk'),
    'C:\\Users\\omchoubey\\Desktop\\qmtrix\\Quotexautotrade.apk'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return res.download(p, 'Quotexautotrade.apk');
    }
  }
  res.status(404).send('APK file not found');
});

// Dashboard SPA routes
dashboardRoutes.forEach((route) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(dashboardDist, 'index.html'));
  });
});

// Admin SPA routes - serve dashboard app
adminRoutes2.forEach((route) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(dashboardDist, 'index.html'));
  });
});

// Serve original frontend for everything else
app.use(express.static(frontendDist));

// Original SPA Fallback
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  
  if (dashboardRoutes.some((r) => req.path === r || req.path.startsWith(r + '/')) ||
      adminRoutes2.some((r) => req.path === r || req.path.startsWith(r + '/'))) {
    return res.sendFile(path.join(dashboardDist, 'index.html'));
  }
  
  const indexPath = path.join(frontendDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend build not found');
  }
});

// Setup WebSocket Server
setupWebSocketServer(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` QX AUTO TRADE Backend Server listening on port ${PORT}`);
  console.log(` WebSocket Real-Time Server Ready`);
  console.log(`=======================================================`);
});
