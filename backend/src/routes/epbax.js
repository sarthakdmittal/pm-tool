const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getEPBAXItems,
  createEPBAXItem,
  updateEPBAXItem,
  deleteEPBAXItem,
} = require('../controllers/epbaxController');

router.use(auth);

router.get('/', getEPBAXItems);
router.post('/', adminOnly, createEPBAXItem);
router.put('/:itemId', updateEPBAXItem);
router.delete('/:itemId', adminOnly, deleteEPBAXItem);

module.exports = router;
