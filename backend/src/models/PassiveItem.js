const mongoose = require('mongoose');

const PassiveItemSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    slNo: Number,
    location: { type: String, required: true },
    cablingAllocated: { type: Number, default: 0 }, // in Mtrs
    cablingCompleted: { type: Number, default: 0 }, // in Mtrs
    cablingVendor: String,
    remarks: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

PassiveItemSchema.virtual('completionPercent').get(function () {
  if (!this.cablingAllocated || this.cablingAllocated === 0) return 0;
  return Math.min(100, Math.round((this.cablingCompleted / this.cablingAllocated) * 100));
});

module.exports = mongoose.model('PassiveItem', PassiveItemSchema);
