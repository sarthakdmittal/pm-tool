const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const {
  getPassiveItems,
  createPassiveItem,
  updatePassiveItem,
  deletePassiveItem,
} = require('../controllers/passiveController');

router.use(auth);

router.get('/', getPassiveItems);
router.post('/', createPassiveItem);
router.put('/:itemId', updatePassiveItem);
router.delete('/:itemId', deletePassiveItem);

module.exports = router;
