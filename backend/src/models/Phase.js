const mongoose = require('mongoose');

const phaseSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    phaseName: {
      type: String,
      enum: ['supply', 'installation', 'testing', 'handover'],
      required: [true, 'Phase name is required'],
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    completionPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'delayed'],
      default: 'not_started',
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Phase', phaseSchema);
