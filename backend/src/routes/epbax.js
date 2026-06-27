const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const {
  getEPBAXItems,
  createEPBAXItem,
  updateEPBAXItem,
  deleteEPBAXItem,
} = require('../controllers/epbaxController');

router.use(auth);

router.get('/', getEPBAXItems);
router.post('/', createEPBAXItem);
router.put('/:itemId', updateEPBAXItem);
router.delete('/:itemId', deleteEPBAXItem);

module.exports = router;
