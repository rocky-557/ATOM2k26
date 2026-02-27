const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// GET /api/public-stats
router.get('/', adminController.getPublicStats);

module.exports = router;
