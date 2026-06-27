const EPBAXItem = require('../models/EPBAXItem');
const Project = require('../models/Project');

const getEPBAXItems = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const items = await EPBAXItem.find({ project: req.params.id }).sort({ slNo: 1, createdAt: 1 });

    const totalItems = items.length;
    const installedCount = items.filter(
      (i) => i.installationStatus && i.installationStatus.toLowerCase() === 'done'
    ).length;
    const handedOverCount = items.filter(
      (i) => i.handoverStatus && i.handoverStatus.toLowerCase() === 'done'
    ).length;

    res.json({
      items,
      summary: {
        totalItems,
        installedCount,
        handedOverCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createEPBAXItem = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const item = await EPBAXItem.create({ ...req.body, project: req.params.id });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
};

const updateEPBAXItem = async (req, res, next) => {
  try {
    const item = await EPBAXItem.findOne({
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

const deleteEPBAXItem = async (req, res, next) => {
  try {
    const item = await EPBAXItem.findOneAndDelete({
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
  getEPBAXItems,
  createEPBAXItem,
  updateEPBAXItem,
  deleteEPBAXItem,
};
