const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    customer: {
      name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true,
      },
      company: {
        type: String,
        trim: true,
        default: '',
      },
      phone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: '',
      },
      address: {
        street: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
        country: { type: String, default: 'India' },
      },
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
        productTitle: {
          type: String,
          required: true,
        },
        size: {
          type: String,
          default: 'Standard / Custom',
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        pricePerUnit: {
          type: Number,
          default: 0,
        },
        specialInstructions: {
          type: String,
          default: '',
        },
      },
    ],
    totalQuantity: {
      type: Number,
      default: 1,
    },
    estimatedTotal: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'In Production', 'Dispatched', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Advance Paid', 'Fully Paid', 'Not Applicable'],
      default: 'Pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate human-readable order number if missing
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `JHC-${Date.now().toString().slice(-4)}${randomDigits}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
