require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded carpet images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve local product carpet images from root Project Carpet folder
app.use('/images', express.static(path.join(__dirname, '..')));

// Serve Admin Portal static files
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// Serve Client Website files from parent directory
app.use(express.static(path.join(__dirname, '..')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isMongo = mongoose.connection.readyState === 1;
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    database: isMongo ? 'mongodb_connected' : 'local_storage_active',
    mode: isMongo ? 'MongoDB Atlas' : 'Local JSON Persistent Storage',
    server: 'Jagdish Handloom Carpets Backend',
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', statsRoutes);

// Fallback route for Admin SPA navigation
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Fallback route for client website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`🧶 Jagdish Handloom Carpets Backend Server Running!`);
  console.log(`🌐 Website URL:   http://localhost:${PORT}`);
  console.log(`🛡️  Admin Portal:  http://localhost:${PORT}/admin`);
  console.log(`📡 Health Check:  http://localhost:${PORT}/api/health`);
  console.log(`========================================================\n`);
});
