const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '../data');
const dbFile = path.join(dataDir, 'local_db.json');

// Ensure directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initial seed data
const getInitialData = () => {
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@12345', salt);

  return {
    admins: [
      {
        _id: 'admin-001',
        name: 'Jagdish Admin',
        email: (process.env.ADMIN_EMAIL || 'admin@jagdishcarpets.com').toLowerCase(),
        password: hashedPassword,
        role: 'superadmin',
        createdAt: new Date().toISOString(),
      },
    ],
    products: [
      {
        _id: 'prod-001',
        title: 'Traditional Wool Carpets',
        category: 'Traditional Carpets',
        description: 'Classic oriental and floral motifs, rich vibrant colours, and durable 100% natural wool — perfect for traditional home décor and luxury hospitality.',
        priceRange: '₹4,500 - ₹12,000 / sq.m',
        basePrice: 4500,
        imageUrl: '/images/carpet5.jpg',
        sizesAvailable: ['4x6 ft', '5x8 ft', '6x9 ft', '8x10 ft', 'Custom Sizes'],
        tag: 'Wholesale Available',
        material: '100% Handloom Blended Wool',
        isFeatured: true,
        inStock: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'prod-002',
        title: 'Flatweave Dhurrie Rugs',
        category: 'Dhurrie Rugs',
        description: 'Lightweight, reversible, tightly woven and durable. A bestseller in modern and minimalist interior markets with geometric motifs.',
        priceRange: '₹1,800 - ₹4,500 / sq.m',
        basePrice: 1800,
        imageUrl: '/images/carpet4.jpg',
        sizesAvailable: ['3x5 ft', '4x6 ft', '5x8 ft', 'Runner 2.5x8 ft', 'Custom'],
        tag: 'Custom Sizes',
        material: 'Pure Cotton & Fine Wool Dhurrie',
        isFeatured: true,
        inStock: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'prod-003',
        title: 'Custom Order Carpets',
        category: 'Bespoke & Export',
        description: 'Specific size, pattern, colour matching, or private label branding? We accept custom bulk orders and produce strictly to client specifications.',
        priceRange: 'Made to Specification',
        basePrice: 3500,
        imageUrl: '/images/carpet1.jpg',
        sizesAvailable: ['Any Custom Dimension', 'Hallway Runners', 'Wall-to-Wall'],
        tag: 'Bulk Orders',
        material: 'Custom Wool, Silk Blend, Cotton',
        isFeatured: true,
        inStock: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: 'prod-004',
        title: 'Prayer Mats & Small Rugs',
        category: 'Prayer Rugs',
        description: 'Handwoven prayer mats and small decorative accent rugs with intricate borders — highly sought after across domestic retail and export markets.',
        priceRange: '₹800 - ₹2,500 / piece',
        basePrice: 800,
        imageUrl: '/images/carpet2.jpg',
        sizesAvailable: ['2x3.5 ft', '2.5x4 ft', 'Rolls Available'],
        tag: 'High Demand',
        material: 'High-Density Handloom Yarn',
        isFeatured: true,
        inStock: true,
        createdAt: new Date().toISOString(),
      },
    ],
    enquiries: [],
    orders: [],
  };
};

// Read Database
const readData = () => {
  if (!fs.existsSync(dbFile)) {
    const initial = getInitialData();
    fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(dbFile, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    const initial = getInitialData();
    fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
};

// Write Database
const writeData = (data) => {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
};

const store = {
  getCollection: (name) => {
    const db = readData();
    return db[name] || [];
  },

  find: (collectionName, predicate = () => true) => {
    const db = readData();
    const list = db[collectionName] || [];
    return list.filter(predicate);
  },

  findOne: (collectionName, predicate) => {
    const db = readData();
    const list = db[collectionName] || [];
    return list.find(predicate) || null;
  },

  findById: (collectionName, id) => {
    const db = readData();
    const list = db[collectionName] || [];
    return list.find((item) => String(item._id) === String(id)) || null;
  },

  create: (collectionName, item) => {
    const db = readData();
    if (!db[collectionName]) db[collectionName] = [];
    const newItem = {
      _id: 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item,
    };
    db[collectionName].unshift(newItem);
    writeData(db);
    return newItem;
  },

  findByIdAndUpdate: (collectionName, id, updates) => {
    const db = readData();
    const list = db[collectionName] || [];
    const idx = list.findIndex((item) => String(item._id) === String(id));
    if (idx === -1) return null;

    list[idx] = {
      ...list[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db[collectionName] = list;
    writeData(db);
    return list[idx];
  },

  findByIdAndDelete: (collectionName, id) => {
    const db = readData();
    const list = db[collectionName] || [];
    const idx = list.findIndex((item) => String(item._id) === String(id));
    if (idx === -1) return null;

    const [deleted] = list.splice(idx, 1);
    db[collectionName] = list;
    writeData(db);
    return deleted;
  },

  count: (collectionName, predicate = () => true) => {
    const db = readData();
    const list = db[collectionName] || [];
    return list.filter(predicate).length;
  },
};

module.exports = store;
