require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

// Route imports
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');

const dns = require('dns');

if (process.env.NODE_ENV === 'development') {
  dns.setServers(['1.1.1.1']);
}

const app = express();

// ─── Security & Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Global rate limiter
app.use(
  rateLimit({
    windowMs: 30 * 60 * 1000, // 15 minutes
    max: 500, // limit each IP to 500 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later',
    },
  }),
);

// Request logger
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
  });
});

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const bootstrapAdmin = async () => {
  try {
    const User = require('./models/User');
    const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!existing && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      await User.create({
        name: 'Admin',
        phone: '0000000000',
        email: process.env.ADMIN_EMAIL,
        gender: 'prefer_not_to_say',
        password: process.env.ADMIN_PASSWORD,
        role: 'admin',
        isVerified: true,
      });
      logger.info(`Admin user created: ${process.env.ADMIN_EMAIL}`);
    }
  } catch (err) {
    logger.warn('Admin bootstrap skipped:', err.message);
  }
};

const start = async () => {
  await connectDB();
  await bootstrapAdmin();
  if (process.env.NODE_ENV === 'development') {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 QuizLive server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } else {
    app.listen(PORT, () => {
      logger.info(`🚀 QuizLive server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
};

start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Closing server...');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
