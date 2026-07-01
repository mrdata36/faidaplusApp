const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');

router.put('/profile', [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('business_name').trim().notEmpty().withMessage('Business name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const userId = req.userId;
  const { full_name, business_name, email } = req.body;

  db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId], (dupErr, row) => {
    if (dupErr) {
      console.error(dupErr);
      return res.status(500).json({ error: 'Server error' });
    }
    if (row) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    db.run(
      'UPDATE users SET full_name = ?, business_name = ?, email = ? WHERE id = ?',
      [full_name, business_name, email, userId],
      function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Server error' });
        }
        res.json({ full_name, business_name, email });
      }
    );
  });
});

router.put('/password', [
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('confirm_password').custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const userId = req.userId;
  const { current_password, new_password } = req.body;

  db.get('SELECT password FROM users WHERE id = ?', [userId], async (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(current_password, row.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], function (updateErr) {
      if (updateErr) {
        console.error(updateErr);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ success: true });
    });
  });
});

router.put('/preferences', [
  body('currency').optional().isIn(['TZS', 'KES', 'UGX', 'USD']).withMessage('Invalid currency'),
  body('language').optional().isIn(['English', 'Swahili']).withMessage('Invalid language')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const userId = req.userId;
  const { currency = 'TZS', language = 'English' } = req.body;

  db.run('UPDATE users SET currency = ? WHERE id = ?', [currency, userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json({ currency, language });
  });
});

router.get('/business', (req, res) => {
  const userId = req.userId;
  const settings = {};

  db.all('SELECT key, value FROM settings WHERE user_id = ?', [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }

    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    // Default values
    settings.allow_overdraft = settings.allow_overdraft || 'false';

    res.json(settings);
  });
});

router.put('/business', [
  body('allow_overdraft').optional().isIn(['true', 'false']).withMessage('Invalid overdraft setting')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const userId = req.userId;
  const { allow_overdraft = 'false' } = req.body;

  db.run(
    'INSERT OR REPLACE INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, datetime("now"))',
    [userId, 'allow_overdraft', allow_overdraft],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ allow_overdraft });
    }
  );
});

module.exports = router;