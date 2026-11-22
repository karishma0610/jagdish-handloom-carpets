const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { isDBConnected } = require('../config/db');
const store = require('../config/store');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret_jagdish_handloom_jwt_key_2026', {
    expiresIn: '7d',
  });
};

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isDBConnected()) {
      const admin = await Admin.findOne({ email: cleanEmail });
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await admin.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      admin.lastLogin = new Date();
      await admin.save();

      return res.json({
        success: true,
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          token: generateToken(admin._id),
        },
      });
    } else {
      // Local fallback
      const admin = store.findOne('admins', (a) => a.email === cleanEmail);
      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      store.findByIdAndUpdate('admins', admin._id, { lastLogin: new Date().toISOString() });

      return res.json({
        success: true,
        data: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          token: generateToken(admin._id),
        },
      });
    }
  } catch (error) {
    console.error('[AuthController] Login error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// @desc    Get current logged in admin
// @route   GET /api/auth/me
// @access  Private (Admin)
const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.admin,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update admin password
// @route   PUT /api/auth/update-password
// @access  Private (Admin)
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (isDBConnected()) {
      const admin = await Admin.findById(req.admin._id);
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

      const isMatch = await admin.matchPassword(currentPassword);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password does not match' });

      admin.password = newPassword;
      await admin.save();
    } else {
      const admin = store.findById('admins', req.admin._id);
      if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

      const isMatch = await bcrypt.compare(currentPassword, admin.password);
      if (!isMatch) return res.status(400).json({ success: false, message: 'Current password does not match' });

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);
      store.findByIdAndUpdate('admins', admin._id, { password: hashed });
    }

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  updatePassword,
};
