// ──────────────────────────────────────
// routes/auth.js — Authentication Routes
// Maps to: /api/auth/*
// ──────────────────────────────────────

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/signup
router.post('/signup', authController.signup);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/session
router.get('/session', authController.getSession);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/forgot-password — send OTP
router.post('/forgot-password', authController.forgotPassword);

// POST /api/auth/verify-otp — validate OTP
router.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/reset-password — update password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
