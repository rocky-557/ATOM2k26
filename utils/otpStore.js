// ──────────────────────────────────────
// utils/otpStore.js — In-memory OTP Store
// OTPs expire after 10 minutes
// ──────────────────────────────────────

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Map<email, { otp: string, expiresAt: number }>
const store = new Map();

/**
 * Generate and store a 6-digit OTP for the given email.
 * @returns {string} the generated OTP
 */
function setOtp(email) {
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    store.set(email.toLowerCase(), {
        otp,
        expiresAt: Date.now() + OTP_TTL_MS
    });
    return otp;
}

/**
 * Verify the OTP for a given email.
 * Returns: 'ok' | 'expired' | 'invalid'
 */
function verifyOtp(email, inputOtp) {
    const entry = store.get(email.toLowerCase());
    if (!entry) return 'invalid';
    if (Date.now() > entry.expiresAt) {
        store.delete(email.toLowerCase());
        return 'expired';
    }
    if (entry.otp !== inputOtp.trim()) return 'invalid';
    return 'ok';
}

/**
 * Remove OTP entry (call after successful password reset).
 */
function clearOtp(email) {
    store.delete(email.toLowerCase());
}

module.exports = { setOtp, verifyOtp, clearOtp };
