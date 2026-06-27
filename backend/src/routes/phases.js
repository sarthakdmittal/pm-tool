const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const { getPhases, updatePhase } = require('../controllers/phaseController');

router.use(auth);

router.get('/', getPhases);
router.put('/:phaseId', updatePhase);

module.exports = router;
