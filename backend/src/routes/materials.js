const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');
const {
  getMaterials,
  getMaterialsSummary,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} = require('../controllers/materialController');

router.use(auth);

router.get('/', getMaterials);
router.get('/summary', getMaterialsSummary);
router.post('/', createMaterial);
router.put('/:materialId', updateMaterial);
router.delete('/:materialId', deleteMaterial);

module.exports = router;
