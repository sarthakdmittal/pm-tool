const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { notifyTask, notifyOverdue } = require('../controllers/notificationController');

router.use(auth, adminOnly);

router.post('/tasks/:taskId/notify', notifyTask);
router.post('/notify-overdue', notifyOverdue);

module.exports = router;
