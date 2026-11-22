const Product = require('../models/Product');
const { isDBConnected } = require('../config/db');
const store = require('../config/store');
const fs = require('fs');
const path = require('path');

// @desc    Get all products (public)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search, inStock } = req.query;

    if (isDBConnected()) {
      const filter = {};
      if (category && category !== 'All') filter.category = category;
      if (inStock !== undefined) filter.inStock = inStock === 'true';
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { material: { $regex: search, $options: 'i' } },
          { tag: { $regex: search, $options: 'i' } },
        ];
      }

      const products = await Product.find(filter).sort({ isFeatured: -1, createdAt: -1 });
      return res.json({ success: true, count: products.length, data: products });
    } else {
      const products = store.find('products', (p) => {
        if (category && category !== 'All' && p.category !== category) return false;
        if (inStock !== undefined && String(p.inStock) !== inStock) return false;
        if (search) {
          const s = search.toLowerCase();
          const matches =
            (p.title && p.title.toLowerCase().includes(s)) ||
            (p.description && p.description.toLowerCase().includes(s)) ||
            (p.material && p.material.toLowerCase().includes(s)) ||
            (p.tag && p.tag.toLowerCase().includes(s));
          if (!matches) return false;
        }
        return true;
      });

      return res.json({ success: true, count: products.length, data: products });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = isDBConnected()
      ? await Product.findById(req.params.id)
      : store.findById('products', req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new product (with optional image file)
// @route   POST /api/products
// @access  Private (Admin)
const createProduct = async (req, res) => {
  try {
    const { title, category, description, priceRange, basePrice, tag, material, sizesAvailable, isFeatured, inStock } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Product title is required' });
    }

    let imageUrl = req.body.imageUrl || '/images/carpet1.jpg';
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename;
    }

    let parsedSizes = ['4x6 ft', '5x8 ft', '6x9 ft', 'Custom Sizes'];
    if (sizesAvailable) {
      if (Array.isArray(sizesAvailable)) {
        parsedSizes = sizesAvailable;
      } else if (typeof sizesAvailable === 'string') {
        parsedSizes = sizesAvailable.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const payload = {
      title: title.trim(),
      category: category || 'Traditional Carpets',
      description: description ? description.trim() : '',
      priceRange: priceRange || 'Contact for Wholesale Price',
      basePrice: parseFloat(basePrice) || 0,
      imageUrl,
      sizesAvailable: parsedSizes,
      tag: tag || 'Wholesale Available',
      material: material || '100% Handloom Wool / Cotton',
      isFeatured: isFeatured === 'true' || isFeatured === true,
      inStock: inStock !== 'false' && inStock !== false,
    };

    let product;
    if (isDBConnected()) {
      product = await Product.create(payload);
    } else {
      product = store.create('products', payload);
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    console.error('[ProductController] createProduct error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Admin)
const updateProduct = async (req, res) => {
  try {
    const { title, category, description, priceRange, basePrice, tag, material, sizesAvailable, isFeatured, inStock, imageUrl } = req.body;
    const updateData = {};

    if (title) updateData.title = title.trim();
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description.trim();
    if (priceRange !== undefined) updateData.priceRange = priceRange.trim();
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice) || 0;
    if (tag !== undefined) updateData.tag = tag.trim();
    if (material !== undefined) updateData.material = material.trim();
    if (inStock !== undefined) updateData.inStock = inStock === 'true' || inStock === true;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;

    if (sizesAvailable) {
      if (Array.isArray(sizesAvailable)) {
        updateData.sizesAvailable = sizesAvailable;
      } else if (typeof sizesAvailable === 'string') {
        updateData.sizesAvailable = sizesAvailable.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    if (req.file) {
      updateData.imageUrl = '/uploads/' + req.file.filename;
    } else if (imageUrl) {
      updateData.imageUrl = imageUrl;
    }

    let product;
    if (isDBConnected()) {
      product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    } else {
      product = store.findByIdAndUpdate('products', req.params.id, updateData);
    }

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
const deleteProduct = async (req, res) => {
  try {
    const existing = isDBConnected()
      ? await Product.findById(req.params.id)
      : store.findById('products', req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Optionally clean up local uploaded file
    if (existing.imageUrl && existing.imageUrl.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '..', existing.imageUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    if (isDBConnected()) {
      await Product.findByIdAndDelete(req.params.id);
    } else {
      store.findByIdAndDelete('products', req.params.id);
    }

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
