const mongoose = require('mongoose');
const Material = require('../models/Material');
const Project = require('../models/Project');

const getMaterials = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const materials = await Material.find({ project: req.params.id }).sort({ sNo: 1, createdAt: 1 });
    res.json(materials);
  } catch (error) {
    next(error);
  }
};

const getMaterialsSummary = async (req, res, next) => {
  try {
    const result = await Material.aggregate([
      { $match: { project: new mongoose.Types.ObjectId(req.params.id) } },
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
    ]);

    const stats = result[0] || {
      total: 0, closed: 0, open: 0, totalOrdered: 0, totalExecuted: 0, totalBilled: 0,
    };

    const completionPercent =
      stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0;

    res.json({ ...stats, completionPercent });
  } catch (error) {
    next(error);
  }
};

const createMaterial = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const materialData = { ...req.body, project: req.params.id };
    const material = await Material.create(materialData);
    res.status(201).json(material);
  } catch (error) {
    next(error);
  }
};

const updateMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOne({
      _id: req.params.materialId,
      project: req.params.id,
    });

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    Object.assign(material, req.body);
    await material.save();
    res.json(material);
  } catch (error) {
    next(error);
  }
};

const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOneAndDelete({
      _id: req.params.materialId,
      project: req.params.id,
    });

    if (!material) {
      return res.status(404).json({ message: 'Material not found' });
    }

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterials,
  getMaterialsSummary,
  createMaterial,
  updateMaterial,
  deleteMaterial,
};
