const express = require('express');
const router = express.Router();
const db = require('../db/database');

function getMonthlySummary(userId, callback) {
  const incomeQuery = `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE user_id = ? AND type = 'income'
      AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
  `;
  const expenseQuery = `
    SELECT COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE user_id = ? AND type = 'expense'
      AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
  `;
  const lowStockQuery = `
    SELECT COUNT(*) as count
    FROM products
    WHERE user_id = ? AND quantity <= low_stock_threshold
  `;

  db.get(incomeQuery, [userId], (incomeErr, incomeRow) => {
    if (incomeErr) return callback(incomeErr);
    db.get(expenseQuery, [userId], (expenseErr, expenseRow) => {
      if (expenseErr) return callback(expenseErr);
      db.get(lowStockQuery, [userId], (lowStockErr, lowStockRow) => {
        if (lowStockErr) return callback(lowStockErr);

        const income = incomeRow.total || 0;
        const expenses = expenseRow.total || 0;
        const profit = income - expenses;
        const lowStockCount = lowStockRow.count || 0;

        callback(null, { income, expenses, profit, lowStockCount });
      });
    });
  });
}

router.get('/summary', (req, res) => {
  const userId = req.userId;

  getMonthlySummary(userId, (err, summary) => {
    if (err) {
      console.error('Dashboard summary error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.json(summary);
  });
});

function getDailyTotals(userId, dateStr) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT type, COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE user_id = ? AND date = ?
      GROUP BY type
    `;
    db.all(query, [userId, dateStr], (err, rows) => {
      if (err) return reject(err);
      const totals = { income: 0, expense: 0 };
      rows.forEach((row) => {
        if (row.type === 'income') totals.income = row.total;
        if (row.type === 'expense') totals.expense = row.total;
      });
      resolve(totals);
    });
  });
}

router.get('/chart', async (req, res) => {
  try {
    const userId = req.userId;
    const chartData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const totals = await getDailyTotals(userId, dateStr);
      chartData.push({ date: dateStr, income: totals.income, expense: totals.expense });
    }

    res.json(chartData);
  } catch (error) {
    console.error('Dashboard chart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/pie', (req, res) => {
  const userId = req.userId;
  const pieQuery = `
    SELECT category, COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE user_id = ? AND type = 'expense'
      AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
    GROUP BY category
    ORDER BY total DESC
  `;

  db.all(pieQuery, [userId], (err, rows) => {
    if (err) {
      console.error('Dashboard pie error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(rows || []);
  });
});

module.exports = router;