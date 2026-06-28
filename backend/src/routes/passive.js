const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getPassiveItems,
  createPassiveItem,
  updatePassiveItem,
  deletePassiveItem,
} = require('../controllers/passiveController');

router.use(auth);

router.get('/', getPassiveItems);
router.post('/', adminOnly, createPassiveItem);
router.put('/:itemId', updatePassiveItem);
router.delete('/:itemId', adminOnly, deletePassiveItem);

module.exports = router;
