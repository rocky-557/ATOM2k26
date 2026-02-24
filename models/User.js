// ──────────────────────────────────────
// models/User.js — Mongoose User Schema
// Replaces: `users` MySQL table
// ──────────────────────────────────────

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 4,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        match: /^\d{10}$/
    },
    password: {
        type: String,
        required: true,
        select: false          // Don't return password by default
    },
    college: {
        type: String,
        default: 'PSG College of Technology'
    }
}, {
    timestamps: true            // createdAt, updatedAt
});

module.exports = mongoose.model('User', userSchema);
