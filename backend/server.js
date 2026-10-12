const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { initSchema } = require('./config/db');
const seedData = require('./config/seed');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const complaintRoutes = require('./routes/complaints');
const notificationRoutes = require('./routes/notifications');
const slaRoutes = require('./routes/sla');
const analyticsRoutes = require('./routes/analytics');
const reportRoutes = require('./routes/reports');
const directHelpRoutes = require('./routes/directHelp');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sla', slaRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/direct-help', directHelpRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'HOSTELCARE API', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start Server
const startServer = async () => {
  try {
    await initSchema();
    await seedData();
    app.listen(PORT, () => {
      console.log(`🚀 HOSTELCARE Backend Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
