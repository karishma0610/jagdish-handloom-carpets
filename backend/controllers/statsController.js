const fs = require('fs');
const path = require('path');
const Enquiry = require('../models/Enquiry');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { isDBConnected } = require('../config/db');
const store = require('../config/store');
const {
  getEmailConfigStatus,
  resetTransporter,
  sendTestNotification,
} = require('../services/emailService');

// Helper to persist updates to .env file
const updateEnvFile = (updates) => {
  const envPath = path.join(__dirname, '../.env');
  let content = '';
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, 'utf8');
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    const valStr = value !== undefined && value !== null ? String(value) : '';
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${valStr}`);
    } else {
      content += `\n${key}=${valStr}`;
    }
    process.env[key] = valStr;
  }

  fs.writeFileSync(envPath, content, 'utf8');
};

// @desc    Get dashboard summary statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getStats = async (req, res) => {
  try {
    if (isDBConnected()) {
      const [
        totalEnquiries,
        newEnquiries,
        totalOrders,
        pendingOrders,
        totalProducts,
        recentEnquiries,
        recentOrders,
      ] = await Promise.all([
        Enquiry.countDocuments(),
        Enquiry.countDocuments({ status: 'New' }),
        Order.countDocuments(),
        Order.countDocuments({ status: 'Pending' }),
        Product.countDocuments(),
        Enquiry.find().sort({ createdAt: -1 }).limit(5),
        Order.find().sort({ createdAt: -1 }).limit(5),
      ]);

      return res.json({
        success: true,
        data: {
          enquiries: { total: totalEnquiries, new: newEnquiries },
          orders: { total: totalOrders, pending: pendingOrders },
          products: { total: totalProducts },
          recentEnquiries,
          recentOrders,
        },
      });
    } else {
      const allEnquiries = store.getCollection('enquiries');
      const allOrders = store.getCollection('orders');
      const allProducts = store.getCollection('products');

      const newEnquiries = allEnquiries.filter((e) => e.status === 'New').length;
      const pendingOrders = allOrders.filter((o) => o.status === 'Pending').length;

      const recentEnquiries = allEnquiries.slice(0, 5);
      const recentOrders = allOrders.slice(0, 5);

      return res.json({
        success: true,
        data: {
          enquiries: { total: allEnquiries.length, new: newEnquiries },
          orders: { total: allOrders.length, pending: pendingOrders },
          products: { total: allProducts.length },
          recentEnquiries,
          recentOrders,
        },
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current email delivery status
// @route   GET /api/admin/email-status
// @access  Private (Admin)
const getEmailStatus = (req, res) => {
  try {
    const status = getEmailConfigStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update email notification settings (.env)
// @route   POST /api/admin/email-settings
// @access  Private (Admin)
const updateEmailSettings = (req, res) => {
  try {
    const { smtpUser, smtpPass, notificationEmail, smtpHost, smtpPort, web3Key } = req.body;

    const updates = {};
    if (web3Key !== undefined) updates.WEB3FORMS_KEY = web3Key.trim();
    if (smtpUser !== undefined) updates.SMTP_USER = smtpUser.trim();
    if (smtpPass !== undefined) updates.SMTP_PASS = smtpPass.trim().replace(/\s+/g, '');
    if (notificationEmail !== undefined) updates.NOTIFICATION_EMAIL = notificationEmail.trim();
    if (smtpHost !== undefined) updates.SMTP_HOST = smtpHost.trim();
    if (smtpPort !== undefined) updates.SMTP_PORT = smtpPort.trim();

    // Auto-detect provider if host not explicitly provided
    if (!updates.SMTP_HOST && updates.SMTP_USER) {
      const u = updates.SMTP_USER.toLowerCase();
      if (u.includes('gmail.com')) {
        updates.SMTP_HOST = 'smtp.gmail.com';
        updates.SMTP_PORT = '587';
      } else if (u.includes('outlook.com') || u.includes('hotmail.com')) {
        updates.SMTP_HOST = 'smtp-mail.outlook.com';
        updates.SMTP_PORT = '587';
      } else if (u.includes('zoho.')) {
        updates.SMTP_HOST = 'smtp.zoho.in';
        updates.SMTP_PORT = '465';
      } else if (u.includes('yahoo.com')) {
        updates.SMTP_HOST = 'smtp.mail.yahoo.com';
        updates.SMTP_PORT = '465';
      }
    }

    updateEnvFile(updates);
    resetTransporter();

    const status = getEmailConfigStatus();
    res.json({
      success: true,
      message: 'Email notification settings saved and updated successfully!',
      data: status,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send test email to verify credentials
// @route   POST /api/admin/test-email
// @access  Private (Admin)
const sendTestEmail = async (req, res) => {
  try {
    const { targetEmail } = req.body;
    const result = await sendTestNotification(targetEmail);
    res.json({
      success: true,
      message: `Test email sent successfully to ${result.to}! Check your inbox.`,
      data: result,
    });
  } catch (error) {
    console.error('[Admin] Test email failed:', error.message);
    res.status(400).json({
      success: false,
      message: `Failed to send email: ${error.message}`,
      help: error.message.includes('Invalid login') || error.message.includes('Username and Password not accepted')
        ? 'Google rejected the password. Please make sure you are using a 16-character Google App Password (not your normal Gmail login password).'
        : 'Please verify your internet connection and Gmail credentials.',
    });
  }
};

module.exports = {
  getStats,
  getEmailStatus,
  updateEmailSettings,
  sendTestEmail,
};
