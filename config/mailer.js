// ──────────────────────────────────────
// config/mailer.js — Dynamic Nodemailer SMTP Wrapper
// Attempts multiple connection strategies (Ports 465, 587, 25)
// ──────────────────────────────────────

const nodemailer = require('nodemailer');

const baseConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    family: 4,     // Force IPv4 to avoid ENETUNREACH on IPv6
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        ciphers: 'SSLv3', // Helps with some older hosting SSL stacks
        rejectUnauthorized: false
    }
};

// Define fallback strategies in order of preference
const strategies = [
    { port: 465, secure: true, name: 'Port 465 (Implicit SSL)' },
    { port: 587, secure: false, name: 'Port 587 (Explicit STARTTLS)' },
    { port: 25, secure: false, name: 'Port 25 (Standard SMTP)' }
];

// Custom wrapper to attempt each strategy
const dynamicTransporter = {
    sendMail: async (mailOptions) => {
        let lastError = null;

        for (const strategy of strategies) {
            console.log(`[SMTP] Attempting delivery via ${strategy.name}...`);

            const transporter = nodemailer.createTransport({
                ...baseConfig,
                port: strategy.port,
                secure: strategy.secure
            });

            try {
                // Wait to see if it succeeds
                const info = await transporter.sendMail(mailOptions);
                console.log(`[SMTP] ✅ Success using ${strategy.name}`);
                return info; // Exit early on success
            } catch (err) {
                console.log(`[SMTP] ❌ Failed using ${strategy.name}: ${err.message}`);
                lastError = err;
            }
        }

        // If we exhausted all strategies and none worked
        console.error('[SMTP] All delivery strategies failed.');
        throw lastError;
    }
};

module.exports = dynamicTransporter;
