const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { getPayments, createPayment, updatePayment, deletePayment } = require('../controllers/paymentController');

router.use(auth);

router.get('/', getPayments);
router.post('/', adminOnly, createPayment);
router.put('/:pid', updatePayment);
router.delete('/:pid', adminOnly, deletePayment);

module.exports = router;
