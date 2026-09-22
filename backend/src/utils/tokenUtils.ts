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

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AccessTokenPayload {
  userId:    string;
  role:      string;
  tokenType: 'access';
}

export interface RefreshTokenPayload {
  userId:    string;
  tokenType: 'refresh';
  jti:       string; // unique token ID for revocation
}

// ── Config ────────────────────────────────────────────────────────────────────

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET is not set or is too short (minimum 32 characters). ' +
      'Set JWT_SECRET in your .env file.'
    );
  }
  return secret;
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_REFRESH_SECRET (or JWT_SECRET) is not configured.');
  }
  return secret;
}

// ── Access Token ──────────────────────────────────────────────────────────────

export const ACCESS_TOKEN_EXPIRY  = '15m';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export function signAccessToken(payload: Omit<AccessTokenPayload, 'tokenType'>): string {
  return jwt.sign(
    { ...payload, tokenType: 'access' } as AccessTokenPayload,
    getJwtSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, getJwtSecret()) as AccessTokenPayload;
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

export function signRefreshToken(userId: string): { token: string; jti: string } {
  const jti = crypto.randomUUID();
  const token = jwt.sign(
    { userId, tokenType: 'refresh', jti } as RefreshTokenPayload,
    getRefreshSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  return { token, jti };
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, getRefreshSecret()) as RefreshTokenPayload;
}

// ── Password Reset Token ──────────────────────────────────────────────────────
// Cryptographically random, not JWT — simpler and appropriate for email links.

export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
