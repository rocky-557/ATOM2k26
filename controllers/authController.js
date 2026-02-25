// ──────────────────────────────────────
// controllers/authController.js — Authentication Logic
// Replaces: login.php, signup.php, logout.php
// Database: MongoDB via Mongoose
// ──────────────────────────────────────
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const transporter = require('../config/mailer');

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

        // ── Send Welcome Email ──
        try {
            await transporter.sendMail({
                from: `"ATOM 2K26" <${process.env.SMTP_USER}>`,
                to: user.email,
                subject: 'ATOM 2K26 Registration Confirmation',
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #d4af37; border-radius: 8px; overflow: hidden; background-color: #0a0a1e; color: #ffffff;">
                        <div style="padding: 40px; text-align: center;">
                            <h2 style="color: #f4d97a; margin-bottom: 20px;">Thank You for registering to ATOM 2K26</h2>
                            <p style="font-size: 16px; color: #cfd8ff;">Dear ${user.username},</p>
                            <p style="font-size: 16px; color: #cfd8ff;">We have successfully received your registration. Your unique <strong>ATOM ID</strong> is provided below for your reference.</p>
                            
                            <div style="background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); padding: 15px; border-radius: 8px; margin: 25px 0; display: inline-block;">
                                <p style="margin: 0; font-size: 20px; font-weight: bold; color: #f4d97a; letter-spacing: 1px;">ATOM25${user._id}</p>
                            </div>

                            <p style="font-size: 15px; color: #888;">Best Regards,<br>Team ATOM 2K26</p>
                        </div>
                    </div>
                `
            });
        } catch (emailErr) {
            console.error('Failed to send welcome email:', emailErr);
            // We don't block registration if email fails, but log it
        }

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

module.exports = { signup, login, logout, getSession };
