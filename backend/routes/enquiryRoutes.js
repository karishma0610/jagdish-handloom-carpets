const express = require('express');
const router = express.Router();
const {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
} = require('../controllers/enquiryController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Public route for customers
router.post('/', createEnquiry);

// Protected routes for admin
router.get('/', protectAdmin, getEnquiries);
router.get('/:id', protectAdmin, getEnquiryById);
router.patch('/:id', protectAdmin, updateEnquiry);
router.delete('/:id', protectAdmin, deleteEnquiry);

module.exports = router;
