const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(auth);

router.get('/', getTasks);
router.post('/', adminOnly, createTask);
router.put('/:taskId', updateTask);
router.delete('/:taskId', adminOnly, deleteTask);

module.exports = router;
