const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const { sendEmail, sendWhatsApp, buildTaskHtml, buildTaskText, isEmailConfigured, isWhatsAppConfigured } = require('../services/notificationService');

// GET /api/notifications/config — tells the frontend which channels are active
const getNotificationConfig = (req, res) => {
  res.json({
    email: isEmailConfigured(),
    whatsapp: isWhatsAppConfigured(),
  });
};

// POST /api/projects/:id/tasks/:taskId/notify
const notifyTask = async (req, res, next) => {
  try {
    const { email, phone, channel, customMessage } = req.body;
    // channel: 'email' | 'whatsapp' | 'both'

    const [project, task] = await Promise.all([
      Project.findById(req.params.id),
      Task.findOne({ _id: req.params.taskId, project: req.params.id }),
    ]);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const payload = {
      taskName: task.name,
      projectName: project.name,
      status: task.status,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo,
      customMessage,
    };

    const results = { email: null, whatsapp: null };
    const errors = [];

    if ((channel === 'email' || channel === 'both') && email) {
      try {
        await sendEmail({
          to: email,
          subject: `Task "${task.name}" — ${task.status.replace('_', ' ')} [${project.name}]`,
          html: buildTaskHtml(payload),
        });
        results.email = 'sent';
      } catch (err) {
        errors.push(`Email: ${err.message}`);
        results.email = 'failed';
      }
    }

    if ((channel === 'whatsapp' || channel === 'both') && phone) {
      try {
        await sendWhatsApp({ phone, message: buildTaskText(payload) });
        results.whatsapp = 'sent';
      } catch (err) {
        errors.push(`WhatsApp: ${err.message}`);
        results.whatsapp = 'failed';
      }
    }

    if (errors.length && !results.email && !results.whatsapp) {
      return res.status(500).json({ message: errors.join('; ') });
    }

    res.json({ message: 'Notification sent', results, errors });
  } catch (error) {
    next(error);
  }
};

// POST /api/projects/:id/notify-overdue
const notifyOverdue = async (req, res, next) => {
  try {
    const { channel, customMessage } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const now = new Date();
    const overdueTasks = await Task.find({
      project: req.params.id,
      status: { $ne: 'done' },
      dueDate: { $lt: now },
    });

    if (overdueTasks.length === 0) {
      return res.json({ message: 'No overdue tasks found', notified: 0 });
    }

    // Group by assignee name → resolve users
    const allUsers = await User.find({});
    const getUserByName = (name) =>
      allUsers.find((u) => u.name.toLowerCase() === (name || '').toLowerCase());

    let notified = 0;
    const summary = [];

    for (const task of overdueTasks) {
      const user = getUserByName(task.assignedTo);
      const recipientEmail = user?.email;
      const recipientPhone = user?.phone;

      const payload = {
        taskName: task.name,
        projectName: project.name,
        status: task.status,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        customMessage,
      };

      let sent = false;

      if ((channel === 'email' || channel === 'both') && recipientEmail) {
        try {
          await sendEmail({
            to: recipientEmail,
            subject: `Overdue Task: "${task.name}" [${project.name}]`,
            html: buildTaskHtml(payload),
          });
          sent = true;
        } catch (_) {}
      }

      if ((channel === 'whatsapp' || channel === 'both') && recipientPhone) {
        try {
          await sendWhatsApp({ phone: recipientPhone, message: buildTaskText(payload) });
          sent = true;
        } catch (_) {}
      }

      summary.push({ task: task.name, assignedTo: task.assignedTo, notified: sent });
      if (sent) notified++;
    }

    res.json({
      message: `Notified ${notified} of ${overdueTasks.length} overdue tasks`,
      notified,
      total: overdueTasks.length,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotificationConfig, notifyTask, notifyOverdue };
