// ──────────────────────────────────────
// routes/events.js — Event & Profile Routes
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

// GET /api/events/abstract-status?event=INNOVATEX
router.get('/abstract-status', eventController.getAbstractStatus);

// POST /api/events/upload-abstract?event=INNOVATEX  (multipart/form-data, field: abstract)
router.post('/upload-abstract', eventController.uploadMiddleware, eventController.uploadAbstract);

module.exports = router;
