const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require('../controllers/orderController');
const { protectAdmin } = require('../middleware/authMiddleware');

// Public route for order/quote request
router.post('/', createOrder);

// Protected routes for admin
router.get('/', protectAdmin, getOrders);
router.get('/:id', protectAdmin, getOrderById);
router.patch('/:id', protectAdmin, updateOrder);
router.delete('/:id', protectAdmin, deleteOrder);

module.exports = router;
