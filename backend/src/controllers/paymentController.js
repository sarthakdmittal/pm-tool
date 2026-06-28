const Payment = require('../models/Payment');
const Project = require('../models/Project');

const getPayments = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const payments = await Payment.find({ project: req.params.id }).sort({ createdAt: -1 });

    const totalContract = project.totalContractValue || 0;
    const totalReceived = payments
      .filter((p) => p.status === 'received')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPending = payments
      .filter((p) => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);
    const percentPaid = totalContract > 0 ? Math.min(100, Math.round((totalReceived / totalContract) * 100)) : 0;

    res.json({
      payments,
      summary: {
        totalContract,
        totalReceived,
        totalPending,
        percentPaid,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const payment = await Payment.create({ ...req.body, project: req.params.id });
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.pid,
      project: req.params.id,
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    Object.assign(payment, req.body);
    await payment.save();
    res.json(payment);
  } catch (error) {
    next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findOneAndDelete({
      _id: req.params.pid,
      project: req.params.id,
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPayments, createPayment, updatePayment, deletePayment };
