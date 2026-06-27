const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    sNo: Number,
    description: { type: String, required: true },
    orderedQty: Number,
    unit: String,
    billedQty: Number,
    invoicedNumber: String,
    completionStatus: {
      type: String,
      enum: ['closed', 'open', 'Closed', 'Open', ''],
      default: '',
    },
    executedQty: Number,
    remainingQty: Number,
    expectedClosureSchedule: String,
    dependencyIfAny: String,
    ownership: String,
    expectedResolutionTime: String,
    remarks: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

MaterialSchema.virtual('isClosed').get(function () {
  return (this.completionStatus || '').toLowerCase() === 'closed';
});

module.exports = mongoose.model('Material', MaterialSchema);
