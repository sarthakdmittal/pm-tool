const Phase = require('../models/Phase');
const Project = require('../models/Project');

const getPhases = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const phaseOrder = { supply: 0, installation: 1, testing: 2, handover: 3 };
    const phases = await Phase.find({ project: req.params.id });
    phases.sort((a, b) => phaseOrder[a.phaseName] - phaseOrder[b.phaseName]);

    res.json(phases);
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

    if (completionPercent !== undefined) phase.completionPercent = completionPercent;
    if (status !== undefined) phase.status = status;
    if (notes !== undefined) phase.notes = notes;
    if (startDate !== undefined) phase.startDate = startDate;
    if (endDate !== undefined) phase.endDate = endDate;

    await phase.save();

    res.json(phase);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPhases, updatePhase };
