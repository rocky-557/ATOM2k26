const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const path = require('path');
const fs = require('fs');

// GET /api/public-stats
router.get('/', adminController.getPublicStats);

// GET /api/public-stats/abstracts
router.get('/abstracts', adminController.getPublicAbstracts);

// GET /api/public-stats/abstracts/download/:filename
// Protected by same stats password
router.get('/abstracts/download/:filename', (req, res, next) => {
    const password = req.headers['x-stats-password'];
    if (password !== 'atom2k26') {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    const { filename } = req.params;
    if (filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({ error: 'Invalid filename.' });
    }
    const filePath = path.join(__dirname, '../uploads/abstracts', filename);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found.' });
    }
    res.download(filePath, filename);
});

module.exports = router;
