const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../db/database');

router.get('/', (req, res) => {
  const userId = req.userId;
  db.all(
    'SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json({ notifications: rows });
    }
  );
});

router.put('/:id/read', (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  db.run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(200).json({ success: true });
  });
});

router.put('/read-all', (req, res) => {
  const userId = req.userId;
  db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json({ success: true });
  });
});

router.delete('/:id', (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  db.run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.status(204).end();
  });
});

router.post('/', [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('type').optional().isString().withMessage('Type must be text')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const userId = req.userId;
  const { title, message, type = 'info' } = req.body;

  db.run(
    'INSERT INTO notifications (user_id, title, message, type, is_read) VALUES (?, ?, ?, ?, 0)',
    [userId, title, message, type],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.status(201).json({ id: this.lastID, title, message, type });
    }
  );
});

module.exports = router;