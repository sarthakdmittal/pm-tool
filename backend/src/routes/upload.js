const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const { upload, uploadExcel } = require('../controllers/uploadController');

router.post(
  '/excel',
  auth,
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'File upload error' });
      }
      next();
    });
  },
  uploadExcel
);

module.exports = router;
