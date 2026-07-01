const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db/database');

const productValidation = [
  body('product_name').trim().notEmpty().withMessage('Product name is required'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('buying_price').isFloat({ gt: 0 }).withMessage('Buying price must be greater than zero'),
  body('selling_price').isFloat({ gt: 0 }).withMessage('Selling price must be greater than zero'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be zero or more'),
  body('low_stock_threshold').isInt({ min: 0 }).withMessage('Low stock threshold must be zero or more')
];

function createNotification(userId, title, message, type = 'info') {
  db.run(
    'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
    [userId, title, message, type],
    (err) => {
      if (err) console.error('Notification creation error:', err);
    }
  );
}

function checkLowStock(userId, productId, productName, quantity, threshold) {
  if (quantity <= threshold) {
    const type = quantity === 0 ? 'danger' : 'warning';
    const message = quantity === 0
      ? `${productName} is out of stock. Please restock immediately.`
      : `${productName} is low on stock (${quantity} remaining). Consider restocking.`;
    createNotification(userId, 'Low Stock Alert', message, type);
  }
}

router.get('/', (req, res) => {
  const userId = req.userId;
  db.all(
    'SELECT id, product_name, category, buying_price, selling_price, quantity, low_stock_threshold, created_at FROM products WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ products: rows });
    }
  );
});

router.get('/low-stock', (req, res) => {
  const userId = req.userId;
  db.all(
    'SELECT id, product_name, category, buying_price, selling_price, quantity, low_stock_threshold FROM products WHERE user_id = ? AND quantity <= low_stock_threshold ORDER BY quantity ASC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ products: rows });
    }
  );
});

router.post('/', productValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const userId = req.userId;
  const { product_name, category, buying_price, selling_price, quantity, low_stock_threshold } = req.body;

  db.run(
    'INSERT INTO products (user_id, product_name, category, buying_price, selling_price, quantity, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, product_name, category, buying_price, selling_price, quantity, low_stock_threshold],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(201).json({
        id: this.lastID,
        product_name,
        category,
        buying_price,
        selling_price,
        quantity,
        low_stock_threshold
      });
    }
  );
});

router.put('/:id', productValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const userId = req.userId;
  const { id } = req.params;
  const { product_name, category, buying_price, selling_price, quantity, low_stock_threshold } = req.body;

  db.run(
    'UPDATE products SET product_name = ?, category = ?, buying_price = ?, selling_price = ?, quantity = ?, low_stock_threshold = ? WHERE id = ? AND user_id = ?',
    [product_name, category, buying_price, selling_price, quantity, low_stock_threshold, id, userId],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check for low stock after update
      checkLowStock(userId, id, product_name, quantity, low_stock_threshold);

      res.json({ id: Number(id), product_name, category, buying_price, selling_price, quantity, low_stock_threshold });
    }
  );
});

router.delete('/:id', (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  db.run('DELETE FROM products WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(204).end();
  });
});

router.post('/:id/sell', [
  body('quantity_sold').isInt({ gt: 0 }).withMessage('Quantity sold must be greater than zero')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const userId = req.userId;
  const { id } = req.params;
  const { quantity_sold } = req.body;

  db.get('SELECT * FROM products WHERE id = ? AND user_id = ?', [id, userId], (err, product) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (product.quantity < quantity_sold) {
      return res.status(400).json({ error: 'Not enough stock to complete sale' });
    }

    const total_amount = Number((product.selling_price * quantity_sold).toFixed(2));
    const unit_price = product.selling_price;
    const newQuantity = product.quantity - quantity_sold;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run(
        'UPDATE products SET quantity = ? WHERE id = ? AND user_id = ?',
        [newQuantity, id, userId],
        function (updateErr) {
          if (updateErr) {
            console.error(updateErr);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Server error' });
          }

          db.run(
            'INSERT INTO sales (user_id, product_id, quantity_sold, unit_price, total_amount) VALUES (?, ?, ?, ?, ?)',
            [userId, id, quantity_sold, unit_price, total_amount],
            function (saleErr) {
              if (saleErr) {
                console.error(saleErr);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Server error' });
              }

              db.run(
                'INSERT INTO transactions (user_id, type, category, amount, description, date) VALUES (?, ?, ?, ?, ?, DATE("now"))',
                [userId, 'income', 'Sales', total_amount, `Sale of ${product.product_name}`],
                function (txnErr) {
                  if (txnErr) {
                    console.error(txnErr);
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Server error' });
                  }

                  db.run('COMMIT');
                  // Check for low stock after sale
                  checkLowStock(userId, id, product.product_name, newQuantity, product.low_stock_threshold);
                  res.status(201).json({
                    sale: {
                      id: this.lastID,
                      product_id: Number(id),
                      quantity_sold,
                      unit_price,
                      total_amount
                    },
                    product: {
                      ...product,
                      quantity: newQuantity
                    }
                  });
                }
              );
            }
          );
        }
      );
    });
  });
});

module.exports = router;