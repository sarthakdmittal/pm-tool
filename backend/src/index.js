require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
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
const notificationRoutes = require('./routes/notifications');
const { getNotificationConfig } = require('./controllers/notificationController');

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
      if (!origin) return callback(null, true);
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
app.use('/api/projects/:id', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.get('/api/notifications/config', getNotificationConfig);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);

  // Daily cron: 9 AM — auto-notify overdue tasks if email is configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    cron.schedule('0 9 * * *', async () => {
      console.log('[cron] Running daily overdue task notifications...');
      try {
        const Task = require('./models/Task');
        const Project = require('./models/Project');
        const User = require('./models/User');
        const { sendEmail, buildTaskHtml } = require('./services/notificationService');

        const now = new Date();
        const overdueTasks = await Task.find({
          status: { $ne: 'done' },
          dueDate: { $lt: now },
        });

        if (!overdueTasks.length) return;

        const allUsers = await User.find({});
        const allProjects = await Project.find({});
        const projectMap = {};
        allProjects.forEach((p) => { projectMap[p._id.toString()] = p; });

        let sent = 0;
        for (const task of overdueTasks) {
          const user = allUsers.find(
            (u) => u.name.toLowerCase() === (task.assignedTo || '').toLowerCase()
          );
          if (!user?.email) continue;
          const project = projectMap[task.project.toString()];
          try {
            await sendEmail({
              to: user.email,
              subject: `[Daily Reminder] Overdue task: "${task.name}"`,
              html: buildTaskHtml({
                taskName: task.name,
                projectName: project?.name || 'Unknown Project',
                status: task.status,
                dueDate: task.dueDate,
                assignedTo: task.assignedTo,
                customMessage: 'This is your daily reminder about an overdue task.',
              }),
            });
            sent++;
          } catch (err) {
            console.error(`[cron] Failed to notify ${user.email}:`, err.message);
          }
        }
        console.log(`[cron] Sent ${sent} notifications for ${overdueTasks.length} overdue tasks`);
      } catch (err) {
        console.error('[cron] Error:', err.message);
      }
    }, { timezone: 'Asia/Kolkata' });
    console.log('[cron] Daily overdue notification job scheduled at 9 AM IST');
  }
});

module.exports = app;
