const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const {
  getActiveDevices,
  getColumns,
  createActiveDevice,
  updateActiveDevice,
  deleteActiveDevice,
  updateColumns,
} = require('../controllers/activeDeviceController');

router.use(auth);

router.get('/', getActiveDevices);
router.get('/columns', getColumns);
router.post('/columns', updateColumns);
router.post('/', createActiveDevice);
router.put('/:entryId', updateActiveDevice);
router.delete('/:entryId', deleteActiveDevice);

module.exports = router;
