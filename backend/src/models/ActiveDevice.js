const mongoose = require('mongoose');

// Tracks active device installation by area/location
const ActiveDeviceSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    sNo: Number,
    areaLocation: { type: String, required: true },
    deviceItems: [
      {
        itemName: String,
        installed: { type: Number, default: 0 },
        remaining: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// Companion model to store the column headers for a project
const ActiveDeviceColumnSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true,
  },
  columns: [String], // e.g. ["CCTV Camera", "Access Control", "PA Speaker"]
  columnTotals: { type: Map, of: Number, default: {} }, // expected total qty per device type
});

const ActiveDevice = mongoose.model('ActiveDevice', ActiveDeviceSchema);
const ActiveDeviceColumn = mongoose.model('ActiveDeviceColumn', ActiveDeviceColumnSchema);

module.exports = { ActiveDevice, ActiveDeviceColumn };
