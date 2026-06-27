const { ActiveDevice, ActiveDeviceColumn } = require('../models/ActiveDevice');
const Project = require('../models/Project');

const getActiveDevices = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const [entries, columnDoc] = await Promise.all([
      ActiveDevice.find({ project: req.params.id }).sort({ sNo: 1, createdAt: 1 }),
      ActiveDeviceColumn.findOne({ project: req.params.id }),
    ]);

    const columns = columnDoc ? columnDoc.columns : [];

    // Build summary: total devices installed per column
    const columnTotals = {};
    columns.forEach((col) => { columnTotals[col] = 0; });
    entries.forEach((entry) => {
      entry.deviceItems.forEach((item) => {
        if (columnTotals[item.itemName] !== undefined) {
          columnTotals[item.itemName] += item.quantity;
        } else {
          columnTotals[item.itemName] = (columnTotals[item.itemName] || 0) + item.quantity;
        }
      });
    });

    const totalDevicesInstalled = Object.values(columnTotals).reduce((a, b) => a + b, 0);
    const totalLocations = entries.length;

    res.json({
      entries,
      columns,
      summary: {
        totalLocations,
        totalDevicesInstalled,
        columnTotals,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getColumns = async (req, res, next) => {
  try {
    const doc = await ActiveDeviceColumn.findOne({ project: req.params.id });
    res.json({ columns: doc ? doc.columns : [] });
  } catch (error) {
    next(error);
  }
};

const createActiveDevice = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const entry = await ActiveDevice.create({ ...req.body, project: req.params.id });
    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
};

const updateActiveDevice = async (req, res, next) => {
  try {
    const entry = await ActiveDevice.findOne({
      _id: req.params.entryId,
      project: req.params.id,
    });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });

    Object.assign(entry, req.body);
    await entry.save();
    res.json(entry);
  } catch (error) {
    next(error);
  }
};

const deleteActiveDevice = async (req, res, next) => {
  try {
    const entry = await ActiveDevice.findOneAndDelete({
      _id: req.params.entryId,
      project: req.params.id,
    });
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const updateColumns = async (req, res, next) => {
  try {
    const doc = await ActiveDeviceColumn.findOneAndUpdate(
      { project: req.params.id },
      { project: req.params.id, columns: req.body.columns || [] },
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveDevices,
  getColumns,
  createActiveDevice,
  updateActiveDevice,
  deleteActiveDevice,
  updateColumns,
};
