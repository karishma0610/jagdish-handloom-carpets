const Order = require('../models/Order');
const { isDBConnected } = require('../config/db');
const store = require('../config/store');
const {
  sendOrderNotificationToAdmin,
  sendOrderConfirmationToCustomer,
} = require('../services/emailService');

// Helper to make order number
const generateOrderNumber = () => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `JHC-${Date.now().toString().slice(-4)}${randomDigits}`;
};

// @desc    Submit new order / booking quote request
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  try {
    const { customer, items, totalQuantity, estimatedTotal, specialInstructions } = req.body;

    if (!customer || !customer.name || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Customer name and phone number are required.',
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one carpet item.',
      });
    }

    const payload = {
      orderNumber: generateOrderNumber(),
      customer: {
        name: customer.name.trim(),
        company: customer.company ? customer.company.trim() : '',
        phone: customer.phone.trim(),
        email: customer.email ? customer.email.trim() : '',
        address: customer.address || {},
      },
      items: items.map((item) => ({
        product: item.productId || null,
        productTitle: item.title || item.productTitle || 'Custom Carpet Order',
        size: item.size || 'Standard',
        quantity: parseInt(item.quantity, 10) || 1,
        pricePerUnit: parseFloat(item.pricePerUnit) || 0,
        specialInstructions: item.specialInstructions || specialInstructions || '',
      })),
      totalQuantity: parseInt(totalQuantity, 10) || items.reduce((acc, it) => acc + (it.quantity || 1), 0),
      estimatedTotal: parseFloat(estimatedTotal) || 0,
      status: 'Pending',
      paymentStatus: 'Pending',
      adminNotes: '',
    };

    let order;
    if (isDBConnected()) {
      order = await Order.create(payload);
    } else {
      order = store.create('orders', payload);
    }

    // Send emails asynchronously
    sendOrderNotificationToAdmin(order).catch((err) =>
      console.error('[Email Admin Order Error]', err.message)
    );
    if (order.customer.email) {
      sendOrderConfirmationToCustomer(order).catch((err) =>
        console.error('[Email Customer Order Error]', err.message)
      );
    }

    res.status(201).json({
      success: true,
      message: `Your booking request has been submitted successfully! Reference #${order.orderNumber}`,
      data: order,
    });
  } catch (error) {
    console.error('[OrderController] createOrder error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create order request. Please try again.',
      error: error.message,
    });
  }
};

// @desc    Get all orders (with status and search filters)
// @route   GET /api/orders
// @access  Private (Admin)
const getOrders = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;

    if (isDBConnected()) {
      const filter = {};
      if (status && status !== 'All') filter.status = status;
      if (search) {
        filter.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'customer.name': { $regex: search, $options: 'i' } },
          { 'customer.phone': { $regex: search, $options: 'i' } },
          { 'customer.email': { $regex: search, $options: 'i' } },
          { 'customer.company': { $regex: search, $options: 'i' } },
        ];
      }
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const total = await Order.countDocuments(filter);
      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      return res.json({ success: true, count: orders.length, total, data: orders });
    } else {
      const list = store.find('orders', (o) => {
        if (status && status !== 'All' && o.status !== status) return false;
        if (search) {
          const s = search.toLowerCase();
          const matches =
            (o.orderNumber && o.orderNumber.toLowerCase().includes(s)) ||
            (o.customer.name && o.customer.name.toLowerCase().includes(s)) ||
            (o.customer.phone && o.customer.phone.includes(s)) ||
            (o.customer.email && o.customer.email.toLowerCase().includes(s)) ||
            (o.customer.company && o.customer.company.toLowerCase().includes(s));
          if (!matches) return false;
        }
        return true;
      });

      return res.json({ success: true, count: list.length, total: list.length, data: list });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order by ID or orderNumber
// @route   GET /api/orders/:id
// @access  Private (Admin)
const getOrderById = async (req, res) => {
  try {
    const order = isDBConnected()
      ? await Order.findById(req.params.id)
      : store.findById('orders', req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id
// @access  Private (Admin)
const updateOrder = async (req, res) => {
  try {
    const { status, paymentStatus, adminNotes } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    let order;
    if (isDBConnected()) {
      order = await Order.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      order = store.findByIdAndUpdate('orders', req.params.id, updateData);
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Order updated successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin)
const deleteOrder = async (req, res) => {
  try {
    const deleted = isDBConnected()
      ? await Order.findByIdAndDelete(req.params.id)
      : store.findByIdAndDelete('orders', req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
