// ──────────────────────────────────────
// controllers/eventController.js — Event Registration Logic
// Replaces: insert_event.php, register.php, profile.php (data fetching)
// Database: MongoDB via Mongoose
// ──────────────────────────────────────

const Registration = require('../models/Registration');

/**
 * POST /api/events/register
 *
 * Mirrors original PHP logic: one row per user, comma-appended events.
 */
async function registerForEvent(req, res, next) {
    try {
        const { evname } = req.body;
        const email = req.session.email;
        const username = req.session.username;
        const mobile = req.session.mobile;
        const userId = req.session.userId;

        if (!evname)
            return res.status(400).json({ error: 'No event name provided.' });

        // Check if a registration doc exists for this user
        const existing = await Registration.findOne({ email });

        if (existing) {
            const currentEvents = existing.evname.split(', ');

            // Duplicate check
            if (currentEvents.includes(evname)) {
                return res.status(409).json({ error: 'You are already registered for this event.' });
            }

            // Append new event
            existing.evname = existing.evname + ', ' + evname;
            existing.registration_date = new Date();
            existing.mobile = mobile;
            await existing.save();

            return res.json({ message: 'Event registered successfully.' });
        }

        // New registration doc
        await Registration.create({
            userId,
            username,
            email,
            evname,
            mobile,
            registration_date: new Date()
        });

        res.status(201).json({ message: 'Event registered successfully.' });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/events/my-events
 */
async function getMyEvents(req, res, next) {
    try {
        const email = req.session.email;

        const reg = await Registration.findOne({ email });

        if (!reg) {
            return res.json({ events: [] });
        }

        const events = reg.evname.split(', ').map(e => e.trim()).filter(Boolean);
        res.json({ events });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/events/profile
 * Returns user session data.
 */
async function getProfile(req, res, next) {
    try {
        res.json({
            userId: req.session.userId,
            username: req.session.username,
            email: req.session.email,
            mobile: req.session.mobile,
            atomId: `ATOM25${req.session.userId}`,
            college: req.session.college || 'PSG College of Technology'
        });
    } catch (err) {
        next(err);
    }
}

module.exports = { registerForEvent, getMyEvents, getProfile };
