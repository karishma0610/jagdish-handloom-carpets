const Enquiry = require('../models/Enquiry');
const { isDBConnected } = require('../config/db');
const store = require('../config/store');
const {
  sendEnquiryNotificationToAdmin,
  sendEnquiryConfirmationToCustomer,
} = require('../services/emailService');

// @desc    Submit a new enquiry from website
// @route   POST /api/enquiries
// @access  Public
const createEnquiry = async (req, res) => {
  try {
    const { name, company, phone, email, category, quantity, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name and Phone / WhatsApp are required fields.',
      });
    }

    const payload = {
      name: name.trim(),
      company: company ? company.trim() : '',
      phone: phone.trim(),
      email: email ? email.trim() : '',
      category: category || 'General Wholesale Inquiry',
      quantity: quantity ? quantity.trim() : '',
      message: message ? message.trim() : '',
      status: 'New',
      adminNotes: '',
      ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
    };

    let enquiry;
    if (isDBConnected()) {
      enquiry = await Enquiry.create(payload);
    } else {
      enquiry = store.create('enquiries', payload);
    }

    // Send emails asynchronously
    sendEnquiryNotificationToAdmin(enquiry).catch((err) =>
      console.error('[Email Notification Error]', err.message)
    );
    if (enquiry.email) {
      sendEnquiryConfirmationToCustomer(enquiry).catch((err) =>
        console.error('[Email Confirmation Error]', err.message)
      );
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your enquiry has been received. Our team will contact you shortly.',
      data: enquiry,
    });
  } catch (error) {
    console.error('[EnquiryController] createEnquiry error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to submit enquiry. Please try again or call us directly.',
      error: error.message,
    });
  }
};

// @desc    Get all enquiries with filters
// @route   GET /api/enquiries
// @access  Private (Admin)
const getEnquiries = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;

    if (isDBConnected()) {
      const filter = {};
      if (status && status !== 'All') filter.status = status;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { message: { $regex: search, $options: 'i' } },
        ];
      }
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const total = await Enquiry.countDocuments(filter);
      const enquiries = await Enquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      return res.json({ success: true, count: enquiries.length, total, data: enquiries });
    } else {
      let list = store.find('enquiries', (e) => {
        if (status && status !== 'All' && e.status !== status) return false;
        if (search) {
          const s = search.toLowerCase();
          const matches =
            (e.name && e.name.toLowerCase().includes(s)) ||
            (e.company && e.company.toLowerCase().includes(s)) ||
            (e.phone && e.phone.includes(s)) ||
            (e.email && e.email.toLowerCase().includes(s)) ||
            (e.message && e.message.toLowerCase().includes(s));
          if (!matches) return false;
        }
        return true;
      });

      const total = list.length;
      return res.json({ success: true, count: list.length, total, data: list });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single enquiry by ID
// @route   GET /api/enquiries/:id
// @access  Private (Admin)
const getEnquiryById = async (req, res) => {
  try {
    const enquiry = isDBConnected()
      ? await Enquiry.findById(req.params.id)
      : store.findById('enquiries', req.params.id);

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update enquiry status and admin notes
// @route   PATCH /api/enquiries/:id
// @access  Private (Admin)
const updateEnquiry = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    let enquiry;
    if (isDBConnected()) {
      enquiry = await Enquiry.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      enquiry = store.findByIdAndUpdate('enquiries', req.params.id, updateData);
    }

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.json({ success: true, message: 'Enquiry updated successfully', data: enquiry });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete enquiry
// @route   DELETE /api/enquiries/:id
// @access  Private (Admin)
const deleteEnquiry = async (req, res) => {
  try {
    const deleted = isDBConnected()
      ? await Enquiry.findByIdAndDelete(req.params.id)
      : store.findByIdAndDelete('enquiries', req.params.id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
};
