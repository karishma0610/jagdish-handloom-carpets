const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Traditional Carpets',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    priceRange: {
      type: String,
      default: 'Contact for Wholesale Price',
      trim: true,
    },
    basePrice: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
      required: true,
      default: '/images/carpet1.jpg',
    },
    sizesAvailable: {
      type: [String],
      default: ['4x6 ft', '5x8 ft', '6x9 ft', 'Custom Sizes'],
    },
    tag: {
      type: String,
      default: 'Wholesale Available',
      trim: true,
    },
    material: {
      type: String,
      default: '100% Handloom Wool / Cotton',
      trim: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Product', productSchema);
