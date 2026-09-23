/**
 * Token Utilities
 *
 * Centralized JWT signing/verification helpers.
 *
 * SECURITY RULES:
 *  - JWT_SECRET must come from environment — never hardcoded.
 *  - Access tokens: short-lived (15 minutes).
 *  - Refresh tokens: longer-lived (7 days), stored as bcrypt hash in DB.
 *  - Tokens carry minimal payload: userId, role, tokenType.
 *  - Sensitive fields (passwordHash, private data) are NEVER in tokens.
 */
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
// ── Config ────────────────────────────────────────────────────────────────────
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('JWT_SECRET is not set or is too short (minimum 32 characters). ' +
            'Set JWT_SECRET in your .env file.');
    }
    return secret;
}
function getRefreshSecret() {
    const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        throw new Error('JWT_REFRESH_SECRET (or JWT_SECRET) is not configured.');
    }
    return secret;
}
// ── Expiry Config ─────────────────────────────────────────────────────────────
function getAccessTokenExpiry() {
    if (process.env.ACCESS_TOKEN_EXPIRE_MINUTES) {
        const mins = process.env.ACCESS_TOKEN_EXPIRE_MINUTES.trim();
        return /^\d+$/.test(mins) ? `${mins}m` : mins;
    }
    return process.env.ACCESS_TOKEN_EXPIRY || '15m';
}

function getRefreshTokenExpiryDays() {
    if (process.env.REFRESH_TOKEN_EXPIRE_DAYS) {
        const days = process.env.REFRESH_TOKEN_EXPIRE_DAYS.trim();
        return /^\d+$/.test(days) ? Number(days) : 7;
    }
    return 7;
}

// ── Access Token ──────────────────────────────────────────────────────────────
export const ACCESS_TOKEN_EXPIRY = getAccessTokenExpiry();
export const REFRESH_TOKEN_EXPIRY = `${getRefreshTokenExpiryDays()}d`;
export const REFRESH_TOKEN_EXPIRY_MS = getRefreshTokenExpiryDays() * 24 * 60 * 60 * 1000;
export function signAccessToken(payload) {
    return jwt.sign({ ...payload, tokenType: 'access' }, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}
export function verifyAccessToken(token) {
    return jwt.verify(token, getJwtSecret());
}
// ── Refresh Token ─────────────────────────────────────────────────────────────
export function signRefreshToken(userId) {
    const jti = crypto.randomUUID();
    const token = jwt.sign({ userId, tokenType: 'refresh', jti }, getRefreshSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
    return { token, jti };
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, getRefreshSecret());
}
// ── Password Reset Token ──────────────────────────────────────────────────────
// Cryptographically random, not JWT — simpler and appropriate for email links.
export function generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
}
