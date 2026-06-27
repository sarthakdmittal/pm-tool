const mongoose = require('mongoose');

const EPBAXItemSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    slNo: Number,
    location: { type: String, required: true },
    installationStatus: String,
    handoverStatus: String,
    pendingWork: String,
    remarks: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('EPBAXItem', EPBAXItemSchema);
