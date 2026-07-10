const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');

// Normalize camelCase fields from frontend to snake_case for SQLite backend expectations
router.use((req, res, next) => {
  if (req.body) {
    if (req.body.name && !req.body.full_name) {
      req.body.full_name = req.body.name;
    }
    if (req.body.currentPassword && !req.body.current_password) {
      req.body.current_password = req.body.currentPassword;
    }
    if (req.body.newPassword && !req.body.new_password) {
      req.body.new_password = req.body.newPassword;
    }
    if (req.body.confirmPassword && !req.body.confirm_password) {
      req.body.confirm_password = req.body.confirmPassword;
    }
  }
  next();
});

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

router.get('/profile', (req, res) => {
  const userId = req.userId;
  db.get('SELECT full_name, business_name, email, currency FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error loading profile' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.all('SELECT key, value FROM settings WHERE user_id = ?', [userId], (settingsErr, rows) => {
      if (settingsErr) {
        console.error(settingsErr);
        return res.status(500).json({ error: 'Server error loading settings' });
      }

      const settingsMap = {};
      rows.forEach(r => {
        settingsMap[r.key] = r.value;
      });

      const profile = {
        name: user.full_name,
        full_name: user.full_name,
        business_name: user.business_name,
        email: user.email
      };

      const preferences = {
        currency: user.currency || 'TZS',
        language: settingsMap['language'] || 'English'
      };

      const notifications = {
        email_alerts: settingsMap['email_alerts'] === 'true',
        sms_alerts: settingsMap['sms_alerts'] === 'true',
        low_stock_alerts: settingsMap['low_stock_alerts'] !== 'false',
        expiry_alerts: settingsMap['expiry_alerts'] !== 'false'
      };

      res.json({ profile, preferences, notifications });
    });
  });
});

router.put('/notifications', (req, res) => {
  const userId = req.userId;
  const { email_alerts, sms_alerts, low_stock_alerts, expiry_alerts } = req.body;

  const updates = [
    { key: 'email_alerts', val: String(!!email_alerts) },
    { key: 'sms_alerts', val: String(!!sms_alerts) },
    { key: 'low_stock_alerts', val: String(!!low_stock_alerts) },
    { key: 'expiry_alerts', val: String(!!expiry_alerts) }
  ];

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    let hasErr = false;
    updates.forEach(upd => {
      db.run(
        'INSERT OR REPLACE INTO settings (user_id, key, value, updated_at) VALUES (?, ?, ?, datetime("now"))',
        [userId, upd.key, upd.val],
        (err) => {
          if (err) {
            console.error(err);
            hasErr = true;
          }
        }
      );
    });

    db.run('COMMIT', (err) => {
      if (err || hasErr) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: 'Failed to update notification settings' });
      }
      res.json({ email_alerts, sms_alerts, low_stock_alerts, expiry_alerts });
    });
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