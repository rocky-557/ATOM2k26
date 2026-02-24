// ──────────────────────────────────────
// middleware/authGuard.js — Session Guards
// Replaces: session checks scattered across PHP files
// ──────────────────────────────────────

const bcrypt = require('bcryptjs');

/**
 * Ensures user is logged in.
 */
function requireLogin(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated. Please log in.' });
    }
    next();
}

/**
 * Ensures admin password is valid (bcrypt-verified).
 * Password sent via x-admin-password header only (no query param — URL logging risk).
 */
async function requireAdmin(req, res, next) {
    const password = req.headers['x-admin-password'];

    if (!password) {
        return res.status(401).json({ error: 'Admin password required.' });
    }

    try {
        const isValid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);
        if (!isValid) {
            return res.status(403).json({ error: 'Invalid admin credentials.' });
        }
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { requireLogin, requireAdmin };
