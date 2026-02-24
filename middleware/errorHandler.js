// ──────────────────────────────────────
// middleware/errorHandler.js — Global Error Handler
// Prevents the server from crashing on unhandled errors
// ──────────────────────────────────────

function errorHandler(err, req, res, next) {
    console.error('❌ Server Error:', err.message);
    console.error(err.stack);

    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Something went wrong. Please try again.'
            : err.message
    });
}

module.exports = errorHandler;
