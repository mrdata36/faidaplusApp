const cron = require('node-cron');
const db = require('../db/database');

const insertNotification = (userId, title, message, type = 'info') => {
  db.run(
    'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)',
    [userId, title, message, type],
    (err) => {
      if (err) {
        console.error('Notification insert failed:', err);
      }
    }
  );
};

cron.schedule('0 20 * * *', () => {
  db.all('SELECT id FROM users', [], (err, users) => {
    if (err) {
      return console.error('Daily reminder cron error:', err);
    }
    users.forEach((user) => {
      insertNotification(user.id, 'Daily Reminder', 'Usisahau kurekodi mauzo ya leo!', 'daily_reminder');
    });
  });
});

cron.schedule('0 */6 * * *', () => {
  db.all('SELECT id, user_id, product_name, quantity, low_stock_threshold FROM products', [], (err, products) => {
    if (err) {
      return console.error('Low stock cron error:', err);
    }
    const lowStockByUser = {};
    products.forEach((product) => {
      if (product.quantity <= product.low_stock_threshold) {
        if (!lowStockByUser[product.user_id]) {
          lowStockByUser[product.user_id] = [];
        }
        lowStockByUser[product.user_id].push(product);
      }
    });

    Object.entries(lowStockByUser).forEach(([userId, list]) => {
      const names = list.map((product) => product.product_name).slice(0, 3).join(', ');
      const message = `Low stock alert for: ${names}. Please restock soon.`;
      insertNotification(Number(userId), 'Low Stock Alert', message, 'low_stock');
    });
  });
});

cron.schedule('0 9 * * 1', () => {
  const monday = new Date();
  const day = monday.getDay();
  const diff = monday.getDate() - day + 1;
  monday.setDate(diff);
  const weekStart = monday.toISOString().split('T')[0];
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const weekEnd = sunday.toISOString().split('T')[0];

  db.all(
    `SELECT user_id,
      SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
     FROM transactions
     WHERE date BETWEEN ? AND ?
     GROUP BY user_id`,
    [weekStart, weekEnd],
    (err, rows) => {
      if (err) {
        return console.error('Weekly expense cron error:', err);
      }
      rows.forEach((row) => {
        if (row.expenses > row.income) {
          insertNotification(
            row.user_id,
            'Weekly Expense Warning',
            'Matumizi yako yamezidi mapato wiki hii.',
            'expense_warning'
          );
        }
      });
    }
  );
});

module.exports = {};