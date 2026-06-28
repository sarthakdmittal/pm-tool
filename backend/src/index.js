require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const phaseRoutes = require('./routes/phases');
const materialRoutes = require('./routes/materials');
const taskRoutes = require('./routes/tasks');
const uploadRoutes = require('./routes/upload');
const activeDeviceRoutes = require('./routes/activeDevices');
const epbaxRoutes = require('./routes/epbax');
const passiveRoutes = require('./routes/passive');
const paymentRoutes = require('./routes/payments');

const app = express();

// Connect to MongoDB
connectDB();

// Security & logging
app.use(helmet());
app.use(morgan('combined'));

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow localhost (any port) and all vercel.app domains
      if (
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://127.0.0.1') ||
        origin.endsWith('.vercel.app') ||
        origin === process.env.FRONTEND_URL
      ) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/phases', phaseRoutes);
app.use('/api/projects/:id/materials', materialRoutes);
app.use('/api/projects/:id/tasks', taskRoutes);
app.use('/api/projects/:id/active-devices', activeDeviceRoutes);
app.use('/api/projects/:id/epbax', epbaxRoutes);
app.use('/api/projects/:id/passive', passiveRoutes);
app.use('/api/projects/:id/payments', paymentRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

  // Ping self every 10 minutes to prevent Render free tier from sleeping
  if (process.env.BACKEND_URL) {
    const https = require('https');
    const http = require('http');
    setInterval(() => {
      const url = process.env.BACKEND_URL + '/health';
      const client = url.startsWith('https') ? https : http;
      client.get(url, (res) => {
        console.log(`[keep-alive] ping ${url} → ${res.statusCode}`);
      }).on('error', (err) => {
        console.error('[keep-alive] ping failed:', err.message);
      });
    }, 10 * 60 * 1000);
  }
});

module.exports = app;
