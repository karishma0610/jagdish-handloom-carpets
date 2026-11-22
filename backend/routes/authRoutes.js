const express = require('express');
const router = express.Router();
const { login, getMe, updatePassword } = require('../controllers/authController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', protectAdmin, getMe);
router.put('/update-password', protectAdmin, updatePassword);

module.exports = router;
