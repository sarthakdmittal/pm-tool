const PassiveItem = require('../models/PassiveItem');
const Project = require('../models/Project');

const getPassiveItems = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const items = await PassiveItem.find({ project: req.params.id }).sort({ slNo: 1, createdAt: 1 });

    const totalAllocated = items.reduce((s, i) => s + (i.cablingAllocated || 0), 0);
    const totalCompleted = items.reduce((s, i) => s + (i.cablingCompleted || 0), 0);
    const completionPercent =
      totalAllocated > 0 ? Math.min(100, Math.round((totalCompleted / totalAllocated) * 100)) : 0;

    res.json({
      items,
      summary: {
        totalAllocated,
        totalCompleted,
        completionPercent,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createPassiveItem = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const item = await PassiveItem.create({ ...req.body, project: req.params.id });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

const updatePassiveItem = async (req, res, next) => {
  try {
    const item = await PassiveItem.findOne({
      _id: req.params.itemId,
      project: req.params.id,
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });

    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (error) {
    next(error);
  }
};

const deletePassiveItem = async (req, res, next) => {
  try {
    const item = await PassiveItem.findOneAndDelete({
      _id: req.params.itemId,
      project: req.params.id,
    });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPassiveItems,
  createPassiveItem,
  updatePassiveItem,
  deletePassiveItem,
};
