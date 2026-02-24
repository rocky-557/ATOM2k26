// ──────────────────────────────────────
// controllers/authController.js — Authentication Logic
// Replaces: login.php, signup.php, logout.php
// Database: MongoDB via Mongoose
// ──────────────────────────────────────

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const transporter = require('../config/mailer');
const otpStore = require('../utils/otpStore');

/**
 * POST /api/auth/signup
 */
async function signup(req, res, next) {
    try {
        const { name, email, mobile, password, college } = req.body;

        // ── Validation ──
        if (!name || name.length < 4)
            return res.status(400).json({ error: 'Username must be at least 4 characters.' });

        if (!email || !/\S+@\S+\.\S+/.test(email))
            return res.status(400).json({ error: 'Please enter a valid email.' });

        if (!mobile || mobile.length !== 10 || isNaN(mobile))
            return res.status(400).json({ error: 'Mobile number must be exactly 10 digits.' });

        if (!password || password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });

        if (!/[0-9]/.test(password))
            return res.status(400).json({ error: 'Password must contain at least 1 number.' });

        if (!/[A-Z]/.test(password))
            return res.status(400).json({ error: 'Password must contain at least 1 uppercase letter.' });

        if (!/[a-z]/.test(password))
            return res.status(400).json({ error: 'Password must contain at least 1 lowercase letter.' });

        if (!/[^A-Za-z0-9]/.test(password))
            return res.status(400).json({ error: 'Password must contain at least 1 special character.' });

        // ── Check duplicate email ──
        const existingEmail = await User.findOne({ email });
        if (existingEmail)
            return res.status(409).json({ error: 'Email already exists. Please login instead.' });

        // ── Check duplicate mobile ──
        const existingMobile = await User.findOne({ mobile });
        if (existingMobile)
            return res.status(409).json({ error: 'Mobile number already registered.' });

        // ── Hash & Create ──
        const hashedPassword = await bcrypt.hash(password, 12);
        const userCollege = college || 'PSG College of Technology';

        const user = await User.create({
            username: name,
            email,
            mobile,
            password: hashedPassword,
            college: userCollege
        });

        // ── Create session ──
        req.session.userId = user._id.toString();
        req.session.username = user.username;
        req.session.email = user.email;
        req.session.mobile = user.mobile;
        req.session.college = user.college;

        res.status(201).json({
            status: 1,
            message: 'Registration successful!',
            user: { id: user._id, username: user.username, email: user.email, atomId: `ATOM25${user._id}` }
        });
    } catch (err) {
        // Handle Mongoose duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(409).json({ error: `${field} already exists.` });
        }
        next(err);
    }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ error: 'Please enter both email and password.' });

        const user = await User.findOne({ email }).select('+password');

        if (!user)
            return res.status(404).json({ error: 'Email not found. Please register first.' });

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch)
            return res.status(401).json({ error: 'Invalid password. Please try again.' });

        // ── Create session ──
        req.session.userId = user._id.toString();
        req.session.username = user.username;
        req.session.email = user.email;
        req.session.mobile = user.mobile;
        req.session.college = user.college || 'PSG College of Technology';

        res.json({
            status: 1,
            message: 'Login successful!',
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/logout
 */
function logout(req, res) {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Logout failed.' });
        res.json({ message: 'Logged out successfully.' });
    });
}

/**
 * GET /api/auth/session
 */
function getSession(req, res) {
    if (req.session.userId) {
        res.json({
            loggedIn: true,
            user: {
                id: req.session.userId,
                username: req.session.username,
                email: req.session.email,
                mobile: req.session.mobile,
                college: req.session.college
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
}


/**
 * POST /api/auth/forgot-password
 * Validates email exists, generates OTP, sends via SMTP.
 */
async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(404).json({ error: 'No account found with that email.' });

        const otp = otpStore.setOtp(email);

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject: '🔐 ATOM 2K26 — Your Password Reset OTP',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;border:1px solid #d4af37;border-radius:10px;overflow:hidden">
                  <div style="background:#0a0a1e;padding:24px;text-align:center">
                    <h2 style="color:#f4d97a;margin:0;font-size:22px;">ATOM 2K26 — Password Reset</h2>
                  </div>
                  <div style="padding:28px;background:#111;color:#cfd8ff;">
                    <p>Hello <strong>${user.username}</strong>,</p>
                    <p>Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
                    <div style="text-align:center;margin:28px 0">
                      <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#f4d97a;background:#1a1a2e;padding:14px 28px;border-radius:8px;border:1px solid #d4af37">${otp}</span>
                    </div>
                    <p style="font-size:13px;color:#888">If you did not request this, please ignore this email.</p>
                  </div>
                </div>
            `
        });

        res.json({ message: 'OTP sent to your email.' });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/auth/verify-otp
 * Validates the submitted OTP (does NOT clear it yet — reset-password will).
 */
async function verifyOtp(req, res) {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    const result = otpStore.verifyOtp(email, otp);
    if (result === 'ok') return res.json({ message: 'OTP verified.' });
    if (result === 'expired') return res.status(410).json({ error: 'OTP has expired. Please request a new one.' });
    return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
}

/**
 * POST /api/auth/reset-password
 * Verifies OTP one final time, then updates the password.
 */
async function resetPassword(req, res, next) {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword)
            return res.status(400).json({ error: 'Email, OTP, and new password are required.' });

        // Re-verify OTP
        const result = otpStore.verifyOtp(email, otp);
        if (result === 'expired') return res.status(410).json({ error: 'OTP expired. Please restart the reset process.' });
        if (result !== 'ok') return res.status(400).json({ error: 'Invalid OTP.' });

        // Validate new password
        if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain at least 1 uppercase letter.' });
        if (!/[0-9]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain at least 1 number.' });
        if (!/[^A-Za-z0-9]/.test(newPassword)) return res.status(400).json({ error: 'Password must contain at least 1 special character.' });

        const hashed = await bcrypt.hash(newPassword, 12);
        await User.updateOne({ email: email.toLowerCase() }, { password: hashed });

        otpStore.clearOtp(email); // Consume the OTP
        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { signup, login, logout, getSession, forgotPassword, verifyOtp, resetPassword };
