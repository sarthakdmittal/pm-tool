const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { getPhases, createPhase, updatePhase, deletePhase } = require('../controllers/phaseController');

router.use(auth);

router.get('/', getPhases);
router.post('/', adminOnly, createPhase);
router.put('/:phaseId', updatePhase);
router.delete('/:phaseId', adminOnly, deletePhase);

module.exports = router;
