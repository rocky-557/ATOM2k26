// ──────────────────────────────────────
// config/db.js — MongoDB Connection (Mongoose)
// Replaces: mysql2 pool → config.php
// ──────────────────────────────────────

const mongoose = require('mongoose');

async function connectDB() {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/atom2k26';

    try {
        await mongoose.connect(uri);
        console.log('✅ MongoDB connected:', uri);
    } catch (err) {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    }
}

module.exports = connectDB;
