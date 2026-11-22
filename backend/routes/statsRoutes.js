const express = require('express');
const router = express.Router();
const {
  getStats,
  getEmailStatus,
  updateEmailSettings,
  sendTestEmail,
} = require('../controllers/statsController');
const { protectAdmin } = require('../middleware/authMiddleware');

router.get('/stats', protectAdmin, getStats);
router.get('/email-status', protectAdmin, getEmailStatus);
router.post('/email-settings', protectAdmin, updateEmailSettings);
router.post('/test-email', protectAdmin, sendTestEmail);

module.exports = router;
