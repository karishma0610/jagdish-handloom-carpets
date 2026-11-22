const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { isDBConnected } = require('../config/db');
const store = require('../config/store');

const protectAdmin = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecret_jagdish_handloom_jwt_key_2026'
      );

      let admin = null;
      if (isDBConnected()) {
        admin = await Admin.findById(decoded.id).select('-password');
      } else {
        const found = store.findById('admins', decoded.id);
        if (found) {
          const { password, ...rest } = found;
          admin = rest;
        }
      }

      if (!admin) {
        return res.status(401).json({ success: false, message: 'Admin not found or token invalid' });
      }

      req.admin = admin;
      return next();
    } catch (error) {
      console.error('[AuthMiddleware] Token verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

module.exports = { protectAdmin };
