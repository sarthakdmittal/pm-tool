const express = require('express');
const router = express.Router();
const { register, login, me, updateMe, claimAdmin, getUsers, updateUserRole } = require('../controllers/authController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, me);
router.put('/me', auth, updateMe);
router.post('/claim-admin', auth, claimAdmin);
router.get('/users', auth, adminOnly, getUsers);
router.put('/users/:userId/role', auth, adminOnly, updateUserRole);

module.exports = router;
