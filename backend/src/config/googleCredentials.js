/**
 * Google Credentials Manager — Render Secret Files & Environment Variables
 *
 * Supports dual-mode configuration:
 * 1. Render Secret Files (Production recommended):
 *    - GEE: /etc/secrets/gee-service-account.json
 *    - Firebase: /etc/secrets/firebase-service-account.json
 * 2. Environment Variables & Local Development Fallbacks:
 *    - GEE_CREDENTIALS_PATH / FIREBASE_CREDENTIALS_PATH
 *    - Direct env vars: GEE_PROJECT_ID, GEE_SERVICE_ACCOUNT_EMAIL, GEE_PRIVATE_KEY
 *    - Local development JSON files in credentials/ or backend/
 *
 * Security:
 * - Never prints or logs private keys or raw file contents.
 * - Centralizes RS256 JWT signing and token caching for Google APIs.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_ROOT = path.resolve(__dirname, '../../');

// Token cache keyed by `${clientEmail}:${scope}`
const tokenCache = new Map();

/**
 * Safely attempts to read and parse a JSON credentials file.
 * Returns parsed object or null if file does not exist or fails to parse.
 */
function tryLoadJsonFile(filePath) {
  if (!filePath) return null;
  try {
    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(BACKEND_ROOT, filePath);

    if (fs.existsSync(resolvedPath)) {
      const content = fs.readFileSync(resolvedPath, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return { data: parsed, path: resolvedPath };
      }
    }
  } catch (err) {
    console.warn(`[WARN] Failed to read credentials from ${filePath}: ${err.message}`);
  }
  return null;
}

/**
 * Resolves Google Earth Engine (GEE) credentials.
 * Priority:
 * 1. Explicit GEE_CREDENTIALS_PATH / GEE_KEY_FILE
 * 2. Render default secret file (/etc/secrets/gee-service-account.json)
 * 3. Local development candidates (e.g. backend/satellite-monitoring-*-3d6492a07e76.json)
 * 4. Inline environment variables (GEE_PROJECT_ID, GEE_SERVICE_ACCOUNT_EMAIL, GEE_PRIVATE_KEY)
 */
export function getEarthEngineCredentials() {
  const candidatePaths = [
    process.env.GEE_CREDENTIALS_PATH,
    process.env.GEE_KEY_FILE,
    '/etc/secrets/gee-service-account.json',
    path.join(BACKEND_ROOT, 'credentials/gee-service-account.json'),
    path.join(BACKEND_ROOT, 'satellite-monitoring-514409-3d6492a07e76.json'),
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    const loaded = tryLoadJsonFile(candidate);
    if (loaded && loaded.data.client_email && loaded.data.private_key) {
      return {
        isConfigured: true,
        source: loaded.path === '/etc/secrets/gee-service-account.json' ? 'render-secret-file' : 'file',
        path: loaded.path,
        projectId: loaded.data.project_id || process.env.GEE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null,
        clientEmail: loaded.data.client_email,
        privateKey: loaded.data.private_key,
      };
    }
  }

  // Fallback to environment variables
  const projectId = process.env.GEE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null;
  const clientEmail = process.env.GEE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || null;
  const rawKey = process.env.GEE_PRIVATE_KEY || null;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : null;

  const isConfigured = Boolean(projectId && clientEmail && privateKey);

  return {
    isConfigured,
    source: isConfigured ? 'env' : 'unconfigured',
    path: null,
    projectId,
    clientEmail,
    privateKey,
  };
}

/**
 * Resolves Firebase / FCM credentials.
 * Priority:
 * 1. Explicit FIREBASE_CREDENTIALS_PATH / FIREBASE_KEY_FILE
 * 2. Render default secret file (/etc/secrets/firebase-service-account.json)
 * 3. Local development candidates (e.g. backend/satellite-monitoring-*-ff3eea1eb061.json)
 * 4. Inline environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
 * 5. Legacy FIREBASE_SERVER_KEY
 */
export function getFirebaseCredentials() {
  const candidatePaths = [
    process.env.FIREBASE_CREDENTIALS_PATH,
    process.env.FIREBASE_KEY_FILE,
    '/etc/secrets/firebase-service-account.json',
    path.join(BACKEND_ROOT, 'credentials/firebase-service-account.json'),
    path.join(BACKEND_ROOT, 'satellite-monitoring-514409-ff3eea1eb061.json'),
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    const loaded = tryLoadJsonFile(candidate);
    if (loaded && loaded.data.client_email && loaded.data.private_key) {
      return {
        isConfigured: true,
        type: 'service_account',
        source: loaded.path === '/etc/secrets/firebase-service-account.json' ? 'render-secret-file' : 'file',
        path: loaded.path,
        projectId: loaded.data.project_id || process.env.FIREBASE_PROJECT_ID || null,
        clientEmail: loaded.data.client_email,
        privateKey: loaded.data.private_key,
        serverKey: process.env.FIREBASE_SERVER_KEY || null,
      };
    }
  }

  // Fallback to service account environment variables
  const projectId = process.env.FIREBASE_PROJECT_ID || null;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.FIREBASE_SERVICE_ACCOUNT_EMAIL || null;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY || null;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : null;

  if (projectId && clientEmail && privateKey) {
    return {
      isConfigured: true,
      type: 'service_account',
      source: 'env',
      path: null,
      projectId,
      clientEmail,
      privateKey,
      serverKey: process.env.FIREBASE_SERVER_KEY || null,
    };
  }

  // Fallback to legacy server key
  const serverKey = process.env.FIREBASE_SERVER_KEY || null;
  if (serverKey) {
    return {
      isConfigured: true,
      type: 'legacy_server_key',
      source: 'env',
      path: null,
      projectId,
      clientEmail: null,
      privateKey: null,
      serverKey,
    };
  }

  return {
    isConfigured: false,
    type: null,
    source: 'unconfigured',
    path: null,
    projectId: null,
    clientEmail: null,
    privateKey: null,
    serverKey: null,
  };
}

/**
 * Generates and caches an OAuth2 access token for Google Cloud APIs (Earth Engine, FCM v1, etc.)
 * using RS256 JWT assertion with native Node.js crypto.
 *
 * @param {string} clientEmail
 * @param {string} privateKey
 * @param {string} scope
 * @returns {Promise<string>} Bearer Access Token
 */
export async function getGoogleOAuth2Token(clientEmail, privateKey, scope) {
  if (!clientEmail || !privateKey || !scope) {
    throw new Error('clientEmail, privateKey, and scope are required to generate an OAuth2 token');
  }

  const cacheKey = `${clientEmail}:${scope}`;
  const now = Math.floor(Date.now() / 1000);
  const cached = tokenCache.get(cacheKey);

  // Return cached token if valid for at least 5 more minutes
  if (cached && cached.expiresAt > now + 300) {
    return cached.token;
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const claimSet = {
    iss: clientEmail,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (obj) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

  const encodedHeader = base64UrlEncode(header);
  const encodedClaimSet = base64UrlEncode(claimSet);
  const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signatureInput);
  signer.end();

  const signature = signer
    .sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const assertion = `${signatureInput}.${signature}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw Object.assign(
      new Error(`Failed to obtain Google OAuth2 token for scope ${scope}: ${tokenResponse.status} ${errorText}`),
      { statusCode: 502, code: 'GOOGLE_AUTH_FAILED' }
    );
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const expiresAt = now + (tokenData.expires_in || 3600);

  tokenCache.set(cacheKey, { token: accessToken, expiresAt });
  return accessToken;
}

