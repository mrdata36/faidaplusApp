const express = require('express');
const router = express.Router();
const db = require('../db/database');

function getReportData(userId, startDate, endDate, callback) {
  const params = [userId, startDate, endDate];
  const data = {
    totalRevenue: 0,
    totalExpense: 0,
    netProfit: 0,
    profitMargin: 0,
    incomeCount: 0,
    expenseCount: 0,
    totalTransactions: 0,
    categories: [],
  };

  db.get(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalRevenue,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
     FROM transactions
     WHERE user_id = ? AND date BETWEEN ? AND ?`,
    params,
    (err, totalsRow) => {
      if (err) return callback(err);

      data.totalRevenue = totalsRow.totalRevenue;
      data.totalExpense = totalsRow.totalExpense;
      data.netProfit = data.totalRevenue - data.totalExpense;
      data.profitMargin = data.totalRevenue === 0
        ? 0
        : Number(((data.netProfit / data.totalRevenue) * 100).toFixed(1));

      db.get(
        `SELECT
          COUNT(*) AS totalTransactions,
          SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END) AS incomeCount,
          SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END) AS expenseCount
         FROM transactions
         WHERE user_id = ? AND date BETWEEN ? AND ?`,
        params,
        (countErr, countRow) => {
          if (countErr) return callback(countErr);

          data.totalTransactions = countRow.totalTransactions;
          data.incomeCount = countRow.incomeCount;
          data.expenseCount = countRow.expenseCount;

          db.all(
            `SELECT category, COALESCE(SUM(amount), 0) AS total
             FROM transactions
             WHERE user_id = ? AND date BETWEEN ? AND ?
             GROUP BY category
             ORDER BY total DESC`,
            params,
            (catErr, categories) => {
              if (catErr) return callback(catErr);
              data.categories = categories || [];
              callback(null, data);
            }
          );
        }
      );
    }
  );
}

function parseReportRange(type, query) {
  const today = new Date();
  let start = null;
  let end = null;

  if (type === 'custom') {
    start = query.startDate;
    end = query.endDate;
  } else if (type === 'weekly') {
    const reference = new Date(query.startDate || today.toISOString().slice(0, 10));
    const dayIndex = (reference.getDay() + 6) % 7;
    const weekStart = new Date(reference);
    weekStart.setDate(reference.getDate() - dayIndex);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    start = weekStart.toISOString().slice(0, 10);
    end = weekEnd.toISOString().slice(0, 10);
  } else if (type === 'monthly') {
    const monthValue = query.month || today.toISOString().slice(0, 7);
    const [year, month] = monthValue.split('-');
    start = `${year}-${month}-01`;
    end = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);
  } else {
    start = query.date || today.toISOString().slice(0, 10);
    end = start;
  }

  return { start, end };
}

router.get('/', (req, res) => {
  const userId = req.userId;
  const type = req.query.type || 'daily';
  const { start, end } = parseReportRange(type, req.query);

  if (!start || !end) {
    return res.status(400).json({ error: 'Invalid report date range' });
  }

  getReportData(userId, start, end, (err, data) => {
    if (err) {
      console.error('Reports generation error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    res.json({
      reportName: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      start,
      end,
      ...data,
    });
  });
});

module.exports = router;
