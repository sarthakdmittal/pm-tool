const mongoose = require('mongoose');
const Project = require('../models/Project');
const Phase = require('../models/Phase');
const Material = require('../models/Material');
const Task = require('../models/Task');
const { ActiveDevice, ActiveDeviceColumn } = require('../models/ActiveDevice');
const EPBAXItem = require('../models/EPBAXItem');
const PassiveItem = require('../models/PassiveItem');

const PHASE_NAMES = ['supply', 'installation', 'testing', 'handover'];

const spreadDates = (startDate, endDate, count) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalMs = end.getTime() - start.getTime();
  const segmentMs = totalMs / count;

  return Array.from({ length: count }, (_, i) => ({
    start: new Date(start.getTime() + i * segmentMs),
    end: new Date(start.getTime() + (i + 1) * segmentMs),
  }));
};

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });

    const projectsWithCompletion = await Promise.all(
      projects.map(async (project) => {
        const phases = await Phase.find({ project: project._id });
        const overallCompletion =
          phases.length > 0
            ? Math.round(phases.reduce((sum, p) => sum + p.completionPercent, 0) / phases.length)
            : 0;
        return { ...project.toObject(), overallCompletion };
      })
    );

    res.json(projectsWithCompletion);
  } catch (error) {
    next(error);
  }
};

const createProject = async (req, res, next) => {
  try {
    const { name, description, clientName, location, projectCode, startDate, endDate, status } =
      req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: 'Name, startDate, and endDate are required' });
    }

    const project = await Project.create({
      name,
      description,
      clientName,
      location,
      projectCode,
      startDate,
      endDate,
      status: status || 'active',
      createdBy: req.user._id,
    });

    const dateSegments = spreadDates(startDate, endDate, 4);
    const phases = await Phase.insertMany(
      PHASE_NAMES.map((phaseName, i) => ({
        project: project._id,
        phaseName,
        startDate: dateSegments[i].start,
        endDate: dateSegments[i].end,
        completionPercent: 0,
        status: 'not_started',
      }))
    );

    res.status(201).json({ ...project.toObject(), phases });
  } catch (error) {
    next(error);
  }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const phases = await Phase.find({ project: project._id }).sort({ phaseName: 1 });
    const taskCount = await Task.countDocuments({ project: project._id });
    const materialCount = await Material.countDocuments({ project: project._id });

    res.json({ ...project.toObject(), phases, taskCount, materialCount });
  } catch (error) {
    next(error);
  }
};

const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    await Phase.deleteMany({ project: project._id });
    await Material.deleteMany({ project: project._id });
    await Task.deleteMany({ project: project._id });
    await ActiveDevice.deleteMany({ project: project._id });
    await ActiveDeviceColumn.deleteMany({ project: project._id });
    await EPBAXItem.deleteMany({ project: project._id });
    await PassiveItem.deleteMany({ project: project._id });
    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const getProjectStats = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectId = project._id;

    const [phases, tasks, materialAgg, passiveAgg, epbaxItems, activeDevices, columnDoc] =
      await Promise.all([
        Phase.find({ project: projectId }),
        Task.find({ project: projectId }),
        Material.aggregate([
          { $match: { project: projectId } },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              closed: {
                $sum: {
                  $cond: [{ $in: ['$completionStatus', ['Closed', 'closed']] }, 1, 0],
                },
              },
              open: {
                $sum: {
                  $cond: [{ $in: ['$completionStatus', ['Open', 'open']] }, 1, 0],
                },
              },
              totalOrdered: { $sum: '$orderedQty' },
              totalExecuted: { $sum: '$executedQty' },
              totalBilled: { $sum: '$billedQty' },
            },
          },
        ]),
        PassiveItem.aggregate([
          { $match: { project: projectId } },
          {
            $group: {
              _id: null,
              totalAllocated: { $sum: '$cablingAllocated' },
              totalCompleted: { $sum: '$cablingCompleted' },
              count: { $sum: 1 },
            },
          },
        ]),
        EPBAXItem.find({ project: projectId }),
        ActiveDevice.find({ project: projectId }),
        ActiveDeviceColumn.findOne({ project: projectId }),
      ]);

    const now = new Date();
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);

    const daysTotal = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.round((now - start) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.round((end - now) / (1000 * 60 * 60 * 24)));

    const overallCompletion =
      phases.length > 0
        ? Math.round(phases.reduce((sum, p) => sum + p.completionPercent, 0) / phases.length)
        : 0;

    const expectedCompletion = Math.min(100, Math.round((daysElapsed / daysTotal) * 100));
    const isOnTrack = overallCompletion >= expectedCompletion;

    const taskStats = {
      total: tasks.length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter((t) => t.status === 'overdue').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      pending: tasks.filter((t) => t.status === 'pending').length,
    };

    const matStats = materialAgg[0] || {
      total: 0, closed: 0, open: 0, totalOrdered: 0, totalExecuted: 0, totalBilled: 0,
    };
    matStats.completionPercent =
      matStats.total > 0 ? Math.round((matStats.closed / matStats.total) * 100) : 0;

    const passStats = passiveAgg[0] || { totalAllocated: 0, totalCompleted: 0, count: 0 };
    passStats.completionPercent =
      passStats.totalAllocated > 0
        ? Math.min(100, Math.round((passStats.totalCompleted / passStats.totalAllocated) * 100))
        : 0;

    const epbaxStats = {
      total: epbaxItems.length,
      installedCount: epbaxItems.filter(
        (i) => i.installationStatus && i.installationStatus.toLowerCase() === 'done'
      ).length,
      handedOverCount: epbaxItems.filter(
        (i) => i.handoverStatus && i.handoverStatus.toLowerCase() === 'done'
      ).length,
    };

    // Active device column totals
    const columns = columnDoc ? columnDoc.columns : [];
    const columnTotals = {};
    columns.forEach((col) => { columnTotals[col] = 0; });
    activeDevices.forEach((entry) => {
      entry.deviceItems.forEach((item) => {
        columnTotals[item.itemName] = (columnTotals[item.itemName] || 0) + item.quantity;
      });
    });
    const totalDevicesInstalled = Object.values(columnTotals).reduce((a, b) => a + b, 0);
    const activeDeviceStats = {
      totalLocations: activeDevices.length,
      totalDevicesInstalled,
      columns,
      columnTotals,
    };

    res.json({
      overallCompletion,
      expectedCompletion,
      isOnTrack,
      daysTotal,
      daysElapsed,
      daysRemaining,
      phases,
      taskStats,
      materialStats: matStats,
      passiveStats: passStats,
      epbaxStats,
      activeDeviceStats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getProjectStats,
};
