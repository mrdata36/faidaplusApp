require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database
require('./db/database');

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? (process.env.PORT || 3000) : (process.env.PORT || 5000);

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGINS?.split(',') || []
    : true,
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./middleware/auth'), require('./routes/dashboard'));
app.use('/api/transactions', require('./middleware/auth'), require('./routes/transactions'));
app.use('/api/products', require('./middleware/auth'), require('./routes/products'));
app.use('/api/notifications', require('./middleware/auth'), require('./routes/notifications'));
app.use('/api/reports', require('./middleware/auth'), require('./routes/reports'));
app.use('/api/settings', require('./middleware/auth'), require('./routes/settings'));

// Cron jobs
require('./cron/jobs');

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FaidaPlus API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`FaidaPlus server running on port ${PORT}`);
});