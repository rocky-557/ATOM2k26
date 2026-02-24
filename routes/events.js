// ──────────────────────────────────────
// routes/events.js — Event & Profile Routes
// Maps to: /api/events/*, /api/user/*
// ──────────────────────────────────────

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { requireLogin } = require('../middleware/authGuard');

// All event routes require a logged-in user
router.use(requireLogin);

// POST /api/events/register
router.post('/register', eventController.registerForEvent);

// GET /api/events/my-events
router.get('/my-events', eventController.getMyEvents);

// GET /api/user/profile (grouped here for simplicity)
router.get('/profile', eventController.getProfile);

module.exports = router;
