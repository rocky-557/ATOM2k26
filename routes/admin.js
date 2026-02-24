// ──────────────────────────────────────
// routes/admin.js — Admin Panel Routes
// Maps to: /api/admin/*
// ──────────────────────────────────────

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authGuard');

// All admin routes require the admin password
router.use(requireAdmin);

// GET /api/admin/registrations?event=EVENT_NAME
router.get('/registrations', adminController.getRegistrations);

// GET /api/admin/stats
router.get('/stats', adminController.getStats);

// GET /api/admin/unregistered
router.get('/unregistered', adminController.getUnregisteredUsers);

module.exports = router;
