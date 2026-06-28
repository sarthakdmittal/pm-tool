const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  getActiveDevices,
  getColumns,
  createActiveDevice,
  updateActiveDevice,
  deleteActiveDevice,
  updateColumns,
  updateExpectedTotals,
} = require('../controllers/activeDeviceController');

router.use(auth);

router.get('/', getActiveDevices);
router.get('/columns', getColumns);
router.post('/columns', updateColumns);
router.put('/columns', updateExpectedTotals);
router.post('/', adminOnly, createActiveDevice);
router.put('/:entryId', updateActiveDevice);
router.delete('/:entryId', adminOnly, deleteActiveDevice);

module.exports = router;
