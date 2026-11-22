require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Product = require('../models/Product');

const seedData = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    // 1. Seed Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@jagdishcarpets.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';

    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const admin = new Admin({
        name: 'Jagdish Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'superadmin',
      });
      await admin.save();
      console.log(`[Seed] Created default Admin: ${adminEmail} (password: ${adminPassword})`);
    } else {
      console.log(`[Seed] Admin already exists: ${adminEmail}`);
    }

    // 2. Seed Initial Products
    const count = await Product.countDocuments();
    if (count === 0) {
      const initialProducts = [
        {
          title: 'Traditional Wool Carpets',
          category: 'Traditional Carpets',
          description:
            'Classic oriental and floral motifs, rich vibrant colours, and durable 100% natural wool — perfect for traditional home décor and luxury hospitality.',
          priceRange: '₹4,500 - ₹12,000 / sq.m',
          basePrice: 4500,
          imageUrl: '/images/carpet5.jpg',
          sizesAvailable: ['4x6 ft', '5x8 ft', '6x9 ft', '8x10 ft', 'Custom Sizes'],
          tag: 'Wholesale Available',
          material: '100% Handloom Blended Wool',
          isFeatured: true,
          inStock: true,
        },
        {
          title: 'Flatweave Dhurrie Rugs',
          category: 'Dhurrie Rugs',
          description:
            'Lightweight, reversible, tightly woven and durable. A bestseller in modern and minimalist interior markets with geometric motifs.',
          priceRange: '₹1,800 - ₹4,500 / sq.m',
          basePrice: 1800,
          imageUrl: '/images/carpet4.jpg',
          sizesAvailable: ['3x5 ft', '4x6 ft', '5x8 ft', 'Runner 2.5x8 ft', 'Custom'],
          tag: 'Custom Sizes',
          material: 'Pure Cotton & Fine Wool Dhurrie',
          isFeatured: true,
          inStock: true,
        },
        {
          title: 'Custom Order Carpets',
          category: 'Bespoke & Export',
          description:
            'Specific size, pattern, colour matching, or private label branding? We accept custom bulk orders and produce strictly to client specifications.',
          priceRange: 'Made to Specification',
          basePrice: 3500,
          imageUrl: '/images/carpet1.jpg',
          sizesAvailable: ['Any Custom Dimension', 'Hallway Runners', 'Wall-to-Wall'],
          tag: 'Bulk Orders',
          material: 'Custom Wool, Silk Blend, Cotton',
          isFeatured: true,
          inStock: true,
        },
        {
          title: 'Prayer Mats & Small Rugs',
          category: 'Prayer Rugs',
          description:
            'Handwoven prayer mats and small decorative accent rugs with intricate borders — highly sought after across domestic retail and export markets.',
          priceRange: '₹800 - ₹2,500 / piece',
          basePrice: 800,
          imageUrl: '/images/carpet2.jpg',
          sizesAvailable: ['2x3.5 ft', '2.5x4 ft', 'Rolls Available'],
          tag: 'High Demand',
          material: 'High-Density Handloom Yarn',
          isFeatured: true,
          inStock: true,
        },
      ];

      await Product.insertMany(initialProducts);
      console.log(`[Seed] Seeded ${initialProducts.length} default carpet products.`);
    } else {
      console.log(`[Seed] Found ${count} existing products in catalog.`);
    }

    console.log('[Seed] Database initialization complete.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
