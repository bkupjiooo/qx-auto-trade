const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Export Trade History in CSV, Excel (.xls), or PDF
router.get('/export/:userId', (req, res) => {
  const { userId } = req.params;
  const { format } = req.query; // 'csv' | 'excel' | 'pdf' | 'json'

  const logs = db.get('tradeLogs').filter(t => t.userId === userId);
  const user = db.get('users').find(u => u.id === userId);

  if (format === 'excel') {
    let excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/><style>
        table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
        th { background-color: #1E293B; color: #00F0FF; padding: 8px; border: 1px solid #334155; }
        td { padding: 6px; border: 1px solid #CBD5E1; text-align: left; }
        .win { color: #10B981; font-weight: bold; }
        .loss { color: #EF4444; font-weight: bold; }
      </style></head>
      <body>
        <h2>QX AUTO TRADE - Trade Execution Log Report</h2>
        <p>User: ${user?.name || userId} (${user?.email || ''}) | Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Trade ID</th><th>Broker</th><th>Asset</th><th>Direction</th>
              <th>Amount ($)</th><th>Entry Price</th><th>Exit Price</th>
              <th>Result</th><th>P/L ($)</th><th>Strategy</th><th>MTG Level</th><th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr>
                <td>${l.id}</td><td>${l.broker.toUpperCase()}</td><td>${l.asset}</td><td>${l.direction}</td>
                <td>$${l.amount.toFixed(2)}</td><td>${l.entryPrice}</td><td>${l.exitPrice}</td>
                <td class="${l.result.toLowerCase()}">${l.result}</td>
                <td class="${l.profitLoss >= 0 ? 'win' : 'loss'}">${l.profitLoss >= 0 ? '+' : ''}$${l.profitLoss.toFixed(2)}</td>
                <td>${l.strategyName}</td><td>L${l.mtgLevel}</td><td>${l.timestamp}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body></html>
    `;
    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename=qx_auto_trade_report_${userId}.xls`);
    return res.send(excelHtml);
  }

  if (format === 'pdf') {
    let pdfText = `========================================================================\n`;
    pdfText += `               QX AUTO TRADE - AUTOMATED TRADE REPORT                   \n`;
    pdfText += `========================================================================\n`;
    pdfText += `User Account : ${user?.name || userId} (${user?.email || ''})\n`;
    pdfText += `Generated At : ${new Date().toLocaleString()}\n`;
    pdfText += `Total Trades : ${logs.length}\n`;
    pdfText += `========================================================================\n\n`;

    logs.forEach((l, i) => {
      pdfText += `[${i + 1}] Trade ID: ${l.id} | Broker: ${l.broker.toUpperCase()} | Asset: ${l.asset}\n`;
      pdfText += `    Direction: ${l.direction} | Amount: $${l.amount.toFixed(2)} | MTG Level: L${l.mtgLevel}\n`;
      pdfText += `    Entry: ${l.entryPrice} -> Exit: ${l.exitPrice} | Result: ${l.result} (${l.profitLoss >= 0 ? '+' : ''}$${l.profitLoss.toFixed(2)})\n`;
      pdfText += `    Strategy: ${l.strategyName} | Time: ${l.timestamp}\n`;
      pdfText += `------------------------------------------------------------------------\n`;
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=qx_auto_trade_report_${userId}.pdf.txt`);
    return res.send(pdfText);
  }

  // Default CSV format
  const headers = ['Trade ID', 'Broker', 'Asset', 'Direction', 'Amount ($)', 'Entry Price', 'Exit Price', 'Result', 'P/L ($)', 'Strategy', 'MTG Level', 'Ref ID', 'Timestamp'];
  const rows = logs.map(l => [
    l.id,
    l.broker.toUpperCase(),
    l.asset,
    l.direction,
    l.amount,
    l.entryPrice,
    l.exitPrice,
    l.result,
    l.profitLoss,
    `"${l.strategyName}"`,
    l.mtgLevel,
    l.refId,
    l.timestamp
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=qx_auto_trade_report_${userId}.csv`);
  return res.send(csvContent);
});

module.exports = router;
