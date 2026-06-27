const Task = require('../models/Task');
const Project = require('../models/Project');

const getTasks = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const filter = { project: req.params.id };
    if (req.query.phase) {
      filter.phaseName = req.query.phase;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    // Auto-mark overdue tasks
    const now = new Date();
    const updatedTasks = await Promise.all(
      tasks.map(async (task) => {
        if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'done') {
          task.status = 'overdue';
          await task.save();
        }
        return task;
      })
    );

    res.json(updatedTasks);
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const taskData = { ...req.body, project: req.params.id };
    const task = await Task.create(taskData);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      project: req.params.id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const updates = req.body;
    Object.assign(task, updates);

    // Auto-mark as done if completionPercent = 100
    if (task.completionPercent === 100 && task.status !== 'done') {
      task.status = 'done';
      task.completedDate = new Date();
    }

    // Auto-mark overdue if dueDate passed and not done
    const now = new Date();
    if (task.dueDate && new Date(task.dueDate) < now && task.status !== 'done') {
      task.status = 'overdue';
    }

    await task.save();
    res.json(task);
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      project: req.params.id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
