const mongoose = require('mongoose');

// Prevent Mongoose from buffering queries indefinitely when disconnected
mongoose.set('bufferCommands', false);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return true;

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carpet_db';

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500, // Quick check within 2.5s
    });
    isConnected = true;
    console.log(`[MongoDB] ✅ Connected to: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.log(`[MongoDB] ℹ️  Local MongoDB service not detected (${error.message}).`);
    console.log(`[Storage] 🚀 Seamlessly activated built-in local database storage (backend/data/local_db.json).`);
    console.log(`[Storage] Tip: To use MongoDB Compass or Atlas, start MongoDB and restart the server.`);
    return false;
  }
};

const isDBConnected = () => mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
