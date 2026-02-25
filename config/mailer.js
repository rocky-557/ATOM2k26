// ──────────────────────────────────────
// config/mailer.js — Nodemailer SMTP Transporter
// ──────────────────────────────────────

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: true, // Use SSL/TLS for port 465
    family: 4,     // Force IPv4 to avoid ENETUNREACH on IPv6
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

module.exports = transporter;
