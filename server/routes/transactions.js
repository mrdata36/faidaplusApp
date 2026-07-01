const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db/database');

function createNotification(userId, title, message, type = 'info') {
  db.run(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
    [userId, title, message, type],
    (err) => {
      if (err) console.error('Notification creation error:', err);
    }
  );
}

function buildFilterQuery(userId, query) {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (query.type) {
    conditions.push('type = ?');
    params.push(query.type);
  }
  if (query.category) {
    conditions.push('category = ?');
    params.push(query.category);
  }
  if (query.startDate) {
    conditions.push('date >= ?');
    params.push(query.startDate);
  }
  if (query.endDate) {
    conditions.push('date <= ?');
    params.push(query.endDate);
  }
  if (query.search) {
    conditions.push('description LIKE ?');
    params.push(`%${query.search}%`);
  }

  return { where: conditions.join(' AND '), params };
}

function calculateBalance(userId, callback) {
  const incomeQuery = 'SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = ? AND type = "income"';
  const expenseQuery = 'SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE user_id = ? AND type = "expense"';

  db.get(incomeQuery, [userId], (incErr, incRow) => {
    if (incErr) return callback(incErr);
    db.get(expenseQuery, [userId], (expErr, expRow) => {
      if (expErr) return callback(expErr);
      const balance = incRow.total - expRow.total;
      callback(null, balance);
    });
  });
}

function checkDuplicateTransaction(userId, type, category, amount, description, date, callback) {
  const query = `
    SELECT COUNT(*) AS count FROM transactions
    WHERE user_id = ? AND type = ? AND category = ? AND amount = ? AND description = ? AND date = ?
    AND created_at >= datetime('now', '-1 day')
  `;
  db.get(query, [userId, type, category, amount, description, date], (err, row) => {
    if (err) return callback(err);
    callback(null, row.count > 0);
  });
}

function getSetting(userId, key, callback) {
  db.get('SELECT value FROM settings WHERE user_id = ? AND key = ?', [userId, key], (err, row) => {
    if (err) return callback(err);
    callback(null, row ? row.value : null);
  });
}

router.get('/', (req, res) => {
  try {
    const userId = req.userId;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const offset = (page - 1) * limit;
    const { where, params } = buildFilterQuery(userId, req.query);

    const countQuery = `SELECT COUNT(*) as total FROM transactions WHERE ${where}`;
    db.get(countQuery, params, (countErr, countRow) => {
      if (countErr) {
        console.error(countErr);
        return res.status(500).json({ error: 'Server error' });
      }

      const listQuery = `
        SELECT id, type, category, amount, description, date, created_at
        FROM transactions
        WHERE ${where}
        ORDER BY date DESC, created_at DESC
        LIMIT ? OFFSET ?
      `;
      db.all(listQuery, [...params, limit, offset], (listErr, rows) => {
        if (listErr) {
          console.error(listErr);
          return res.status(500).json({ error: 'Server error' });
        }

        res.json({
          transactions: rows,
          meta: {
            page,
            limit,
            total: countRow.total,
            totalPages: Math.ceil(countRow.total / limit)
          }
        });
      });
    });
  } catch (error) {
    console.error('Transactions list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/summary', (req, res) => {
  try {
    const userId = req.userId;
    const start = req.query.start || null;
    const end = req.query.end || null;
    let dateFilter = '';
    const params = [userId];

    if (start) {
      dateFilter += ' AND date >= ?';
      params.push(start);
    }
    if (end) {
      dateFilter += ' AND date <= ?';
      params.push(end);
    }

    const incomeQuery = `SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = ? AND type = 'income' ${dateFilter}`;
    const expenseQuery = `SELECT COALESCE(SUM(amount),0) AS total FROM transactions WHERE user_id = ? AND type = 'expense' ${dateFilter}`;

    db.get(incomeQuery, params, (incErr, incRow) => {
      if (incErr) {
        console.error(incErr);
        return res.status(500).json({ error: 'Server error' });
      }
      db.get(expenseQuery, params, (expErr, expRow) => {
        if (expErr) {
          console.error(expErr);
          return res.status(500).json({ error: 'Server error' });
        }
        const income = incRow.total;
        const expenses = expRow.total;
        res.json({ income, expenses, profit: income - expenses });
      });
    });
  } catch (error) {
    console.error('Transaction summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const transactionValidation = [
  body('type').isIn(['income', 'expense']).withMessage('Type is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than zero'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('description').optional().trim(),
  body('date').isISO8601().withMessage('Valid date is required')
];

router.post('/', transactionValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { type, category, amount, description, date } = req.body;
  const userId = req.userId;

  // Check for duplicate transaction
  checkDuplicateTransaction(userId, type, category, amount, description, date, (dupErr, isDuplicate) => {
    if (dupErr) {
      console.error(dupErr);
      return res.status(500).json({ error: 'Server error' });
    }
    if (isDuplicate) {
      return res.status(400).json({ error: 'Duplicate transaction detected. Please verify the details.' });
    }

    if (type === 'expense') {
      // Calculate current balance
      calculateBalance(userId, (balErr, balance) => {
        if (balErr) {
          console.error(balErr);
          return res.status(500).json({ error: 'Server error' });
        }

        getSetting(userId, 'allow_overdraft', (setErr, allowOverdraft) => {
          if (setErr) {
            console.error(setErr);
            return res.status(500).json({ error: 'Server error' });
          }

          const overdraftAllowed = allowOverdraft === 'true';

          if (amount > balance && !overdraftAllowed) {
            const warning = `Expense of ${amount} exceeds available balance of ${balance}. Enable overdraft in settings to proceed.`;
            return res.status(400).json({ error: warning, warning: true });
          }

          // Proceed with insertion
          insertTransaction();
        });
      });
    } else {
      // For income, no balance check needed
      insertTransaction();
    }

    function insertTransaction() {
      db.run(
        'INSERT INTO transactions (user_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, type, category, amount, description, date],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
          }

          // Check for financial alerts after insertion
          if (type === 'expense') {
            calculateBalance(userId, (balErr, newBalance) => {
              if (!balErr && newBalance < 0) {
                createNotification(userId, 'Negative Balance Alert', `Your account balance is now negative: ${newBalance}.`, 'danger');
              }
              if (amount > 100000) { // Example threshold for large expense
                createNotification(userId, 'Large Expense Recorded', `A large expense of ${amount} was recorded.`, 'warning');
              }
            });
          }

          res.status(201).json({ id: this.lastID, type, category, amount, description, date });
        }
      );
    }
  });
});

router.put('/:id', transactionValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { id } = req.params;
  const { type, category, amount, description, date } = req.body;
  const userId = req.userId;

  // Check for duplicate transaction (excluding current)
  checkDuplicateTransaction(userId, type, category, amount, description, date, (dupErr, isDuplicate) => {
    if (dupErr) {
      console.error(dupErr);
      return res.status(500).json({ error: 'Server error' });
    }
    if (isDuplicate) {
      return res.status(400).json({ error: 'Duplicate transaction detected. Please verify the details.' });
    }

    if (type === 'expense') {
      // Get current transaction to calculate net change
      db.get('SELECT amount FROM transactions WHERE id = ? AND user_id = ?', [id, userId], (getErr, row) => {
        if (getErr) {
          console.error(getErr);
          return res.status(500).json({ error: 'Server error' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Transaction not found' });
        }

        const oldAmount = row.amount;
        const netChange = amount - oldAmount;

        calculateBalance(userId, (balErr, balance) => {
          if (balErr) {
            console.error(balErr);
            return res.status(500).json({ error: 'Server error' });
          }

          getSetting(userId, 'allow_overdraft', (setErr, allowOverdraft) => {
            if (setErr) {
              console.error(setErr);
              return res.status(500).json({ error: 'Server error' });
            }

            const overdraftAllowed = allowOverdraft === 'true';

            if (netChange > balance && !overdraftAllowed) {
              const warning = `Updated expense increase of ${netChange} exceeds available balance of ${balance}. Enable overdraft in settings to proceed.`;
              return res.status(400).json({ error: warning, warning: true });
            }

            // Proceed with update
            updateTransaction();
          });
        });
      });
    } else {
      updateTransaction();
    }

    function updateTransaction() {
      db.run(
        'UPDATE transactions SET type = ?, category = ?, amount = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
        [type, category, amount, description, date, id, userId],
        function (err) {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Server error' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
          }

          // Check for alerts after update
          if (type === 'expense') {
            calculateBalance(userId, (balErr, newBalance) => {
              if (!balErr && newBalance < 0) {
                createNotification(userId, 'Negative Balance Alert', `Your account balance is now negative: ${newBalance}.`, 'danger');
              }
              if (amount > 100000) {
                createNotification(userId, 'Large Expense Updated', `A large expense was updated to ${amount}.`, 'warning');
              }
            });
          }

          res.json({ id: Number(id), type, category, amount, description, date });
        }
      );
    }
  });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  db.run(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.status(204).end();
    }
  );
});

module.exports = router;