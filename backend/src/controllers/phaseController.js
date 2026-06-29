const Phase = require('../models/Phase');
const Project = require('../models/Project');

const getPhases = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const defaultOrder = { supply: 0, installation: 1, testing: 2, handover: 3 };
    const phases = await Phase.find({ project: req.params.id });
    phases.sort((a, b) => {
      const aOrder = defaultOrder[a.phaseName] ?? 99;
      const bOrder = defaultOrder[b.phaseName] ?? 99;
      return aOrder !== bOrder ? aOrder - bOrder : a.createdAt - b.createdAt;
    });

    res.json(phases);
  } catch (error) {
    next(error);
  }
};

const createPhase = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { phaseName, startDate, endDate, status, notes } = req.body;
    if (!phaseName) return res.status(400).json({ message: 'Phase name is required' });

    const phase = await Phase.create({
      project: req.params.id,
      phaseName,
      startDate,
      endDate,
      completionPercent: 0,
      status: status || 'not_started',
      notes,
    });

    res.status(201).json(phase);
  } catch (error) {
    next(error);
  }
};

const deletePhase = async (req, res, next) => {
  try {
    const phase = await Phase.findOneAndDelete({
      _id: req.params.phaseId,
      project: req.params.id,
    });
    if (!phase) return res.status(404).json({ message: 'Phase not found' });
    res.json({ message: 'Phase deleted' });
  } catch (error) {
    next(error);
  }
};

const updatePhase = async (req, res, next) => {
  try {
    const { completionPercent, status, notes, startDate, endDate } = req.body;

    const phase = await Phase.findOne({
      _id: req.params.phaseId,
      project: req.params.id,
    });

    if (!phase) {
      return res.status(404).json({ message: 'Phase not found' });
    }

    if (completionPercent !== undefined) phase.completionPercent = Number(completionPercent);
    if (status !== undefined) phase.status = status;
    if (notes !== undefined) phase.notes = notes;
    if (startDate !== undefined) phase.startDate = startDate || null;
    if (endDate !== undefined) phase.endDate = endDate || null;

    await phase.save();

    res.json(phase);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPhases, createPhase, updatePhase, deletePhase };
