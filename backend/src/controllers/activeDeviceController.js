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
    const expectedTotals = columnDoc && columnDoc.columnTotals ? Object.fromEntries(columnDoc.columnTotals) : {};

    // Build summary: total devices installed per column
    const installedTotals = {};
    columns.forEach((col) => { installedTotals[col] = 0; });
    entries.forEach((entry) => {
      entry.deviceItems.forEach((item) => {
        if (installedTotals[item.itemName] !== undefined) {
          installedTotals[item.itemName] += item.quantity;
        } else {
          installedTotals[item.itemName] = (installedTotals[item.itemName] || 0) + item.quantity;
        }
      });
    });

    const totalDevicesInstalled = Object.values(installedTotals).reduce((a, b) => a + b, 0);
    const totalLocations = entries.length;

    // Build per-device completion stats
    const deviceStats = {};
    columns.forEach((col) => {
      const installed = installedTotals[col] || 0;
      const expected = expectedTotals[col] || 0;
      deviceStats[col] = {
        installed,
        expected,
        remaining: Math.max(0, expected - installed),
        completionPercent: expected > 0 ? Math.min(100, Math.round((installed / expected) * 100)) : 0,
      };
    });

    res.json({
      entries,
      columns,
      expectedTotals,
      summary: {
        totalLocations,
        totalDevicesInstalled,
        columnTotals: installedTotals,
        deviceStats,
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
    const updateData = { project: req.params.id, columns: req.body.columns || [] };
    if (req.body.columnTotals) {
      updateData.columnTotals = req.body.columnTotals;
    }
    const doc = await ActiveDeviceColumn.findOneAndUpdate(
      { project: req.params.id },
      updateData,
      { upsert: true, new: true }
    );
    res.json(doc);
  } catch (error) {
    next(error);
  }
};

const updateExpectedTotals = async (req, res, next) => {
  try {
    // req.body.columnTotals is a map of deviceName -> expectedTotal
    const doc = await ActiveDeviceColumn.findOneAndUpdate(
      { project: req.params.id },
      { $set: { columnTotals: req.body.columnTotals || {} } },
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
  updateExpectedTotals,
};
