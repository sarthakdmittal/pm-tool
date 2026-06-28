const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  invoiceNumber: String,
  description: String,
  amount: { type: Number, required: true },
  paymentDate: Date,
  dueDate: Date,
  status: { type: String, enum: ['pending', 'received', 'overdue'], default: 'pending' },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
