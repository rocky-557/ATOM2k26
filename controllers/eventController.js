// ──────────────────────────────────────
// controllers/eventController.js — Event Registration Logic
// ──────────────────────────────────────

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Registration = require('../models/Registration');

/* ── PAPER PRESENTATION event keys (lowercase) ── */
const PAPER_EVENTS = ['INNOVATEX', 'INTELLICARE'];

/* ── Multer storage: saves to uploads/abstracts/ ── */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/abstracts');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = `${req.session.userId}_${Date.now()}.pdf`;
        cb(null, unique);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') cb(null, true);
        else cb(new Error('Only PDF files are allowed.'));
    }
});

/* ── Export multer middleware so the router can attach it ── */
const uploadMiddleware = upload.single('abstract');

/**
 * POST /api/events/register
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

        const existing = await Registration.findOne({ email });

        if (existing) {
            const currentEvents = existing.evname.split(', ');
            if (currentEvents.includes(evname)) {
                return res.status(409).json({ error: 'You are already registered for this event.' });
            }
            existing.evname = existing.evname + ', ' + evname;
            existing.registration_date = new Date();
            existing.mobile = mobile;
            await existing.save();
            return res.json({ message: 'Event registered successfully.' });
        }

        await Registration.create({ userId, username, email, evname, mobile, registration_date: new Date() });
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
        if (!reg) return res.json({ events: [] });
        const events = reg.evname.split(', ').map(e => e.trim()).filter(Boolean);
        res.json({ events });
    } catch (err) {
        next(err);
    }
}

/**
 * GET /api/events/profile
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

/**
 * GET /api/events/abstract-status?event=INNOVATEX
 * Returns { registered, absUploaded, uploadedAt, originalName } for the session user.
 */
async function getAbstractStatus(req, res, next) {
    try {
        const email = req.session.email;
        const evname = (req.query.event || '').toUpperCase();

        if (!PAPER_EVENTS.includes(evname))
            return res.status(400).json({ error: 'Not a paper presentation event.' });

        const reg = await Registration.findOne({ email }).lean();

        if (!reg) return res.json({ registered: false, absUploaded: false });

        const events = reg.evname.split(',').map(e => e.trim().toUpperCase());
        const registered = events.includes(evname);

        if (!registered) return res.json({ registered: false, absUploaded: false });

        res.json({
            registered: true,
            absUploaded: reg.absUploaded || false,
            uploadedAt: reg.abstractFile?.uploadedAt || null,
            originalName: reg.abstractFile?.originalName || null
        });
    } catch (err) {
        next(err);
    }
}

/**
 * POST /api/events/upload-abstract?event=INNOVATEX
 * Accepts a single PDF file. Saves it and marks absUploaded=true.
 */
async function uploadAbstract(req, res, next) {
    try {
        const email = req.session.email;
        const evname = (req.query.event || '').toUpperCase();

        if (!PAPER_EVENTS.includes(evname))
            return res.status(400).json({ error: 'Not a paper presentation event.' });

        if (!req.file)
            return res.status(400).json({ error: 'No PDF file received.' });

        const reg = await Registration.findOne({ email });

        if (!reg) {
            // Remove uploaded file since there's no registration
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ error: 'You are not registered for this event.' });
        }

        const events = reg.evname.split(',').map(e => e.trim().toUpperCase());
        if (!events.includes(evname)) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'You are not registered for this event.' });
        }

        if (reg.absUploaded) {
            fs.unlinkSync(req.file.path);
            return res.status(409).json({ error: 'Abstract already uploaded.' });
        }

        reg.absUploaded = true;
        reg.abstractFile = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadedAt: new Date()
        };
        await reg.save();

        res.json({ message: 'Abstract uploaded successfully!', originalName: req.file.originalname });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    registerForEvent,
    getMyEvents,
    getProfile,
    getAbstractStatus,
    uploadAbstract,
    uploadMiddleware
};
