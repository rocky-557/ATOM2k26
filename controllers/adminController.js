// ──────────────────────────────────────
// controllers/adminController.js — Admin Supervision Logic
// Replaces: get_registrations.php, adminpage.html (data logic)
// Database: MongoDB via Mongoose
// ──────────────────────────────────────

const User = require('../models/User');
const Registration = require('../models/Registration');

/**
 * GET /api/admin/registrations?event=EVENT_NAME
 */
async function getRegistrations(req, res, next) {
    try {
        const eventName = req.query.event || '';

        let rows;

        if (eventName) {
            // LIKE → regex (case-insensitive partial match)
            rows = await Registration.find({
                evname: { $regex: eventName, $options: 'i' }
            }).lean();

            // Filter to exact event match (mirrors PHP explode/trim logic)
            const filtered = rows.filter(row => {
                const events = row.evname.split(',').map(e => e.trim());
                return events.includes(eventName);
            }).map(row => ({
                id: row._id,
                username: row.username,
                email: row.email,
                evname: eventName,          // Show only the selected event
                registration_date: row.registration_date,
                mobile: row.mobile
            }));

            return res.json({
                count: filtered.length,
                data: filtered
            });
        }

        rows = await Registration.find().lean();

        res.json({
            count: rows.length,
            data: rows.map(row => ({
                id: row._id,
                username: row.username,
                email: row.email,
                evname: row.evname,
                registration_date: row.registration_date,
                mobile: row.mobile
            }))
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/admin/stats
 */
async function getStats(req, res, next) {
    try {
        const totalUsers = await User.countDocuments();
        const totalRegistrations = await Registration.countDocuments();
        const distinctEmails = await Registration.distinct('email');

        res.json({
            totalUsers,
            totalRegistrations,
            usersWithEvents: distinctEmails.length
        });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/admin/unregistered
 * Users who signed up but never registered for any event.
 */
async function getUnregisteredUsers(req, res, next) {
    try {
        const registeredEmails = await Registration.distinct('email');
        const users = await User.find(
            { email: { $nin: registeredEmails } },
            'username email mobile'
        ).lean();
        res.json({ count: users.length, data: users });
    } catch (err) {
        next(err);
    }
}

module.exports = { getRegistrations, getStats, getUnregisteredUsers };
