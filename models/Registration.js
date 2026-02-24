// ──────────────────────────────────────
// models/Registration.js — Mongoose Registration Schema
// Replaces: `registrations` MySQL table
// ──────────────────────────────────────

const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    evname: {
        type: String,
        required: true,
        trim: true
    },
    mobile: {
        type: String,
        default: ''
    },
    registration_date: {
        type: Date,
        default: Date.now
    }
});

// Index for fast lookups used in controllers
registrationSchema.index({ email: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
