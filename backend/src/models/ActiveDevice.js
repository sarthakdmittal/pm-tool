const mongoose = require('mongoose');

// Tracks active device installation by area/location
const ActiveDeviceSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    sNo: Number,
    areaLocation: { type: String, required: true },
    // Dynamic device items — store as array of {itemName, quantity}
    deviceItems: [
      {
        itemName: String,
        quantity: { type: Number, default: 0 },
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
});

const ActiveDevice = mongoose.model('ActiveDevice', ActiveDeviceSchema);
const ActiveDeviceColumn = mongoose.model('ActiveDeviceColumn', ActiveDeviceColumnSchema);

module.exports = { ActiveDevice, ActiveDeviceColumn };
