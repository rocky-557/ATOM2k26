// ──────────────────────────────────────
// server.js — Entry Point
// The ONLY file that "wires everything together"
// ──────────────────────────────────────

require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const os = require('os');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// ─── Security Headers ──────────────
app.use(helmet({
    contentSecurityPolicy: false   // Disable CSP for now (inline scripts/styles)
}));

// ─── CORS ───────────────────────────
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? `http://${HOST}:${PORT}`
        : true,
    credentials: true
}));

// ─── Body Parsers ───────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Session (hardened cookies) ─────
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
}));

// ─── Rate Limiting ──────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many attempts. Try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth', authLimiter);
app.use('/api/admin', authLimiter);

// ─── Static Files ───────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API Routes ─────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));

// ─── Catch-all: serve frontend ──────
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Error Handler (must be last) ───
app.use(errorHandler);

// ─── Connect to MongoDB & Start ─────
connectDB().then(() => {
    app.listen(PORT, HOST, () => {
        const nets = os.networkInterfaces();
        const lanIP = Object.values(nets).flat().find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
        console.log(`\n🚀 ATOM 2K26 Backend running at http://${HOST}:${PORT}`);
        console.log(`📡 LAN Access: http://${lanIP}:${PORT}`);
        console.log(`🔒 Security: helmet ✓ | rate-limit ✓ | httpOnly cookies ✓`);
        console.log(`🍃 Database: MongoDB\n`);
    });
});
