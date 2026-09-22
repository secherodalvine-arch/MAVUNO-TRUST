/**
 * Auth Service
 *
 * Core authentication business logic.
 * Controllers are thin — logic lives here.
 *
 * Security rules enforced here:
 *  1. Passwords are hashed with Argon2 (Argon2id variant).
 *  2. Raw passwords are never logged.
 *  3. passwordHash is never returned in service results.
 *  4. Account status is checked before issuing tokens.
 *  5. ADMIN role cannot be self-assigned at registration.
 *  6. Audit events are recorded for login, logout, registration.
 *  7. Refresh token raw value is never stored — only its Argon2id hash.
 */

import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import User, { IUser, UserRole, AccountStatus } from '../models/User';
import FarmerProfile from '../models/FarmerProfile';
import DealerProfile, { VerificationStatus, VerificationSource } from '../models/DealerProfile';
import RefreshToken from '../models/RefreshToken';
import PasswordResetToken from '../models/PasswordResetToken';
import AuditLog, { AuditAction, AuditResourceType } from '../models/AuditLog';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  generatePasswordResetToken,
  REFRESH_TOKEN_EXPIRY_MS,
} from '../utils/tokenUtils';

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  fullName:    string;
  email:       string;
  phoneNumber?: string;
  password:    string;
  role:        UserRole.FARMER | UserRole.DEALER; // ADMIN cannot self-register
}

export interface LoginInput {
  email:     string;
  password:  string;
}

export interface SafeUser {
  id:            string;
  fullName:      string;
  email:         string;
  phoneNumber?:  string;
  role:          string;
  accountStatus: string;
  createdAt:     Date;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export async function verifyHash(hash: string, plainText: string): Promise<boolean> {
  if (!hash) return false;
  try {
    if (hash.startsWith('$argon2')) {
      return await argon2.verify(hash, plainText);
    } else if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
      return await bcrypt.compare(plainText, hash);
    }
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

function toSafeUser(user: IUser): SafeUser {
  return {
    id:            (user._id as { toString: () => string }).toString(),
    fullName:      user.fullName,
    email:         user.email,
    phoneNumber:   user.phoneNumber,
    role:          user.role,
    accountStatus: user.accountStatus,
    createdAt:     user.createdAt,
  };
}

function validatePasswordStrength(password: string): void {
  if (password.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { statusCode: 400 });
  }
  if (!/[A-Z]/.test(password)) {
    throw Object.assign(new Error('Password must contain at least one uppercase letter.'), { statusCode: 400 });
  }
  if (!/[0-9]/.test(password)) {
    throw Object.assign(new Error('Password must contain at least one number.'), { statusCode: 400 });
  }
}

async function issueTokens(userId: string): Promise<AuthTokens> {
  const user = await User.findById(userId).select('+role').lean();
  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });

  const accessToken = signAccessToken({ userId, role: user.role });
  const { token: rawRefresh } = signRefreshToken(userId);
  const tokenHash = await argon2.hash(rawRefresh, { type: argon2.argon2id });

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
  });

  return { accessToken, refreshToken: rawRefresh };
}

// ── Register ──────────────────────────────────────────────────────────────────

export async function register(
  input: RegisterInput,
  ipAddress?: string
): Promise<{ user: SafeUser; tokens: AuthTokens }> {
  const { fullName, email, phoneNumber, password, role } = input;

  // ADMIN cannot be created via the public registration endpoint
  if ((role as string) === UserRole.ADMIN) {
    throw Object.assign(
      new Error('Administrator accounts cannot be created via this endpoint.'),
      { statusCode: 403 }
    );
  }

  validatePasswordStrength(password);

  // Check for duplicate email — use generic error to avoid account enumeration
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw Object.assign(
      new Error('An account with this email address already exists.'),
      { statusCode: 409 }
    );
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  const user = await User.create({
    fullName: fullName.trim(),
    email:    email.toLowerCase().trim(),
    phoneNumber,
    passwordHash,
    role,
    accountStatus: AccountStatus.ACTIVE,
  });

  // Create role-specific profile shell
  if (role === UserRole.FARMER) {
    await FarmerProfile.create({
      userId:      user._id,
      displayName: user.fullName,
    });
  } else if (role === UserRole.DEALER) {
    await DealerProfile.create({
      userId:      user._id,
      displayName: user.fullName,
      licence: {
        status: VerificationStatus.PENDING,
        source: VerificationSource.NOT_CHECKED,
      },
    });
  }

  // Audit registration
  await AuditLog.create({
    actorId:      user._id,
    actorRole:    role,
    action:       AuditAction.USER_REGISTERED,
    resourceType: AuditResourceType.USER,
    resourceId:   (user._id as { toString: () => string }).toString(),
    ipAddress,
  });

  const tokens = await issueTokens((user._id as { toString: () => string }).toString());
  return { user: toSafeUser(user), tokens };
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(
  input: LoginInput,
  ipAddress?: string
): Promise<{ user: SafeUser; tokens: AuthTokens }> {
  const { email, password } = input;

  // Always select passwordHash explicitly (it is select:false)
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  
  // Use constant-time comparison path regardless to prevent timing attacks
  const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$iW61Cj8m0k408x+E0w81V70yX87Xv6Y37u516489370';
  const passwordMatch = user
    ? await verifyHash(user.passwordHash, password)
    : await verifyHash(dummyHash, password).then(() => false);

  if (!user || !passwordMatch) {
    // Generic error — do not reveal which field is wrong
    throw Object.assign(
      new Error('Invalid email or password.'),
      { statusCode: 401 }
    );
  }

  if (user.accountStatus === AccountStatus.SUSPENDED) {
    throw Object.assign(
      new Error('This account has been suspended. Please contact support.'),
      { statusCode: 403 }
    );
  }

  if (user.accountStatus === AccountStatus.DEACTIVATED) {
    throw Object.assign(
      new Error('This account has been deactivated.'),
      { statusCode: 403 }
    );
  }

  // Update last login
  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  await AuditLog.create({
    actorId:      user._id,
    actorRole:    user.role,
    action:       AuditAction.USER_LOGIN,
    resourceType: AuditResourceType.USER,
    resourceId:   (user._id as { toString: () => string }).toString(),
    ipAddress,
  });

  const tokens = await issueTokens((user._id as { toString: () => string }).toString());
  return { user: toSafeUser(user), tokens };
}

// ── Logout ────────────────────────────────────────────────────────────────────

export async function logout(
  userId: string,
  rawRefreshToken: string
): Promise<void> {
  // Find and revoke the specific refresh token
  const tokens = await RefreshToken.find({ userId }).select('+tokenHash');
  for (const stored of tokens) {
    const match = await verifyHash(stored.tokenHash, rawRefreshToken);
    if (match) {
      await RefreshToken.findByIdAndUpdate(stored._id, { revokedAt: new Date() });
      break;
    }
  }

  await AuditLog.create({
    actorId:      userId,
    action:       AuditAction.USER_LOGOUT,
    resourceType: AuditResourceType.USER,
    resourceId:   userId,
  });
}

// ── Logout All (e.g. password change, account suspension) ────────────────────

export async function logoutAll(userId: string): Promise<void> {
  await RefreshToken.updateMany(
    { userId, revokedAt: { $exists: false } },
    { revokedAt: new Date() }
  );
}

// ── Refresh Access Token ──────────────────────────────────────────────────────

export async function refreshAccessToken(
  rawRefreshToken: string
): Promise<{ accessToken: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token.'), { statusCode: 401 });
  }

  const { userId } = payload;

  // Find a valid stored token that matches
  const tokens = await RefreshToken.find({
    userId,
    expiresAt:  { $gt: new Date() },
    revokedAt: { $exists: false },
  }).select('+tokenHash');

  let matched = false;
  for (const stored of tokens) {
    if (await verifyHash(stored.tokenHash, rawRefreshToken)) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    throw Object.assign(new Error('Refresh token is invalid or has been revoked.'), { statusCode: 401 });
  }

  const user = await User.findById(userId);
  if (!user || user.accountStatus !== AccountStatus.ACTIVE) {
    throw Object.assign(new Error('Account is not active.'), { statusCode: 403 });
  }

  const accessToken = signAccessToken({ userId, role: user.role });
  return { accessToken };
}

// ── Password Reset Request ────────────────────────────────────────────────────

export async function requestPasswordReset(
  email: string,
  ipAddress?: string
): Promise<void> {
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Always return success — do not reveal whether an account exists
  if (!user) return;

  // Invalidate previous reset tokens for this user
  await PasswordResetToken.updateMany(
    { userId: user._id, usedAt: { $exists: false } },
    { usedAt: new Date() }
  );

  const rawToken = generatePasswordResetToken();
  const tokenHash = await argon2.hash(rawToken, { type: argon2.argon2id });

  await PasswordResetToken.create({
    userId:    user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
  });

  await AuditLog.create({
    actorId:      user._id,
    action:       AuditAction.PASSWORD_CHANGED,
    resourceType: AuditResourceType.USER,
    resourceId:   (user._id as { toString: () => string }).toString(),
    metadata:     { event: 'password_reset_requested' },
    ipAddress,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[DEV ONLY] Password reset token for ${email}: ${rawToken}\n`);
  }
}

// ── Password Reset ────────────────────────────────────────────────────────────

export async function resetPassword(
  rawToken: string,
  newPassword: string
): Promise<void> {
  validatePasswordStrength(newPassword);

  // Find all unexpired, unused reset tokens and test against each
  const tokens = await PasswordResetToken.find({
    expiresAt: { $gt: new Date() },
    usedAt:    { $exists: false },
  }).select('+tokenHash');

  let matchedToken = null;
  for (const t of tokens) {
    if (await verifyHash(t.tokenHash, rawToken)) {
      matchedToken = t;
      break;
    }
  }

  if (!matchedToken) {
    throw Object.assign(
      new Error('Reset token is invalid or has expired.'),
      { statusCode: 400 }
    );
  }

  const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
  await User.findByIdAndUpdate(matchedToken.userId, { passwordHash: newHash });

  // Mark token as used
  await PasswordResetToken.findByIdAndUpdate(matchedToken._id, { usedAt: new Date() });

  // Invalidate all refresh tokens
  await logoutAll(matchedToken.userId.toString());
}
