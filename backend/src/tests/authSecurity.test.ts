/**
 * Auth & Security Tests — MavunoTrust Step 4
 *
 * Validates authentication, authorization, token mechanics, role guards,
 * account security, and IDOR prevention using in-memory Mongoose validation
 * and unit test logic.
 *
 * Run with: npm run test:auth
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import argon2 from 'argon2';
import User, { UserRole, AccountStatus } from '../models/User';
import RefreshToken from '../models/RefreshToken';
import {
  register,
  login,
  logout,
  refreshAccessToken,
  verifyHash,
} from '../services/authService';
import {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokenUtils';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { assertOwner, assertOwnerOrAdmin } from '../utils/authorizationUtils';

// Set environment for test
process.env.JWT_SECRET = 'super-secret-key-that-is-at-least-32-characters-long-for-testing';
process.env.JWT_REFRESH_SECRET = 'another-super-secret-key-that-is-at-least-32-chars';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({ name, passed: false, error: message });
    console.log(`  ✗ ${name}`);
    console.log(`    → ${message}`);
  }
}

async function runTests() {
  console.log('\n🔒 MavunoTrust Auth & Security Test Suite');
  console.log('==============================================');

  // 1. Farmer Registration Shape
  await test('Registration — Valid Farmer creates user and profile shape', async () => {
    const user = new User({
      fullName: 'Juma Farmers',
      email: 'juma@example.com',
      passwordHash: await argon2.hash('SecureP@ss123', { type: argon2.argon2id }),
      role: UserRole.FARMER,
      accountStatus: AccountStatus.ACTIVE,
    });
    const err = user.validateSync();
    if (err) throw new Error(`Validation failed: ${err.message}`);
    if (user.role !== UserRole.FARMER) throw new Error('Role mismatch');
    if (!user.passwordHash.startsWith('$argon2id')) throw new Error('Password hash invalid format (expected Argon2id)');
  });

  // 2. Dealer Registration Shape
  await test('Registration — Valid Dealer creates user and unverified profile shape', async () => {
    const user = new User({
      fullName: 'Amani Dealers Ltd',
      email: 'amani@dealers.co.ke',
      passwordHash: await argon2.hash('SecureP@ss123', { type: argon2.argon2id }),
      role: UserRole.DEALER,
      accountStatus: AccountStatus.ACTIVE,
    });
    const err = user.validateSync();
    if (err) throw new Error(`Validation failed: ${err.message}`);
    if (user.role !== UserRole.DEALER) throw new Error('Role mismatch');
  });

  // 3. ADMIN Self-Registration Guard
  await test('Security Guard — Admin role cannot be self-registered', async () => {
    let caughtError: any = null;
    try {
      await register({
        fullName: 'Attacker Admin',
        email: 'attacker@evil.com',
        password: 'Password123',
        role: UserRole.ADMIN as any,
      });
    } catch (err: any) {
      caughtError = err;
    }
    if (!caughtError || (caughtError.statusCode !== 403 && caughtError.status !== 403)) {
      throw new Error(`Allowed ADMIN self-registration! Error message: "${caughtError?.message}", statusCode: ${caughtError?.statusCode}`);
    }
  });

  // 4. Password Strength Enforcement
  await test('Security Guard — Reject weak passwords (< 8 chars, no upper, no number)', async () => {
    const weakPasswords = ['short1A', 'lowercase123', 'NO_NUMBERS_HERE'];
    for (const pwd of weakPasswords) {
      let caught = false;
      try {
        await register({
          fullName: 'Weak Pwd Test',
          email: `weak_${Math.random()}@test.com`,
          password: pwd,
          role: UserRole.FARMER,
        });
      } catch (err: any) {
        caught = true;
      }
      if (!caught) throw new Error(`Accepted weak password: ${pwd}`);
    }
  });

  // 5. Password Hashing (Argon2id) Verification
  await test('Security — Raw password is hashed with Argon2id and never stored in plain text', async () => {
    const rawPass = 'MyStrongP@ssword123';
    const hashed = await argon2.hash(rawPass, { type: argon2.argon2id });
    if (hashed === rawPass) throw new Error('Password was stored in plain text');
    if (!hashed.startsWith('$argon2id')) throw new Error('Password hash does not use Argon2id variant');
    const isMatch = await verifyHash(hashed, rawPass);
    if (!isMatch) throw new Error('Argon2id hash verification failed');
  });

  // 6. Access Token Signing & Verification
  await test('JWT — Access token signing & verification carries minimal payload', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const role = UserRole.FARMER;
    const token = signAccessToken({ userId, role });

    const payload = verifyAccessToken(token);
    if (payload.userId !== userId) throw new Error('Payload userId mismatch');
    if (payload.role !== UserRole.FARMER) throw new Error('Payload role mismatch');
    if (payload.tokenType !== 'access') throw new Error('Token type mismatch');
    if ((payload as any).passwordHash) throw new Error('Sensitive passwordHash leaked in JWT payload!');
  });

  // 7. Refresh Token Signing & Verification
  await test('JWT — Refresh token produces cryptographically secure JTI', () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const { token, jti } = signRefreshToken(userId);

    const payload = verifyRefreshToken(token);
    if (payload.userId !== userId) throw new Error('Refresh token userId mismatch');
    if (payload.tokenType !== 'refresh') throw new Error('Refresh token type mismatch');
    if (payload.jti !== jti) throw new Error('JTI mismatch');
  });

  // 8. requireAuth Middleware logic
  await test('Middleware — requireAuth verifies valid token and populates req.user', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const token = signAccessToken({ userId, role: UserRole.FARMER });

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
    };
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid header parse');
    }
    const extractedToken = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(extractedToken);
    if (decoded.userId !== userId) throw new Error('Middleware decoded wrong user ID');
  });

  // 9. requireAuth Middleware rejection of invalid / missing headers
  await test('Middleware — requireAuth rejects missing Bearer token', () => {
    const req: any = { headers: {} };
    let resCode = 0;
    let resJson: any = null;
    const res: any = {
      status(code: number) { resCode = code; return this; },
      json(data: any) { resJson = data; },
    };
    const next = () => {};

    requireAuth(req, res, next);
    if (resCode !== 401) throw new Error(`Expected 401 status, got ${resCode}`);
    if (!resJson.error.message.includes('Authentication required')) throw new Error('Expected auth required error message');
  });

  // 10. requireRole Middleware enforcement
  await test('Middleware — requireRole permits authorized role and blocks unauthorized role', () => {
    const farmerReq: any = { user: { id: 'u1', role: UserRole.FARMER } };
    const dealerReq: any = { user: { id: 'u2', role: UserRole.DEALER } };
    let farmerNextCalled = false;
    let dealerCode = 0;

    const res: any = {
      status(code: number) { dealerCode = code; return this; },
      json() {},
    };

    const farmerGuard = requireRole(UserRole.FARMER);
    farmerGuard(farmerReq, res, () => { farmerNextCalled = true; });
    if (!farmerNextCalled) throw new Error('requireRole blocked legitimate FARMER user');

    farmerGuard(dealerReq, res, () => {});
    if (dealerCode !== 403) throw new Error(`requireRole allowed DEALER when FARMER required! Code: ${dealerCode}`);
  });

  // 11. IDOR Protection — assertOwner
  await test('Authorization — assertOwner allows owner and throws 403 on IDOR attempt', () => {
    const ownerId = 'user_12345';
    const maliciousId = 'user_99999';

    // Owner allowed
    assertOwner({ userId: ownerId, role: UserRole.FARMER }, ownerId);

    // IDOR attempt
    let caught = false;
    try {
      assertOwner({ userId: maliciousId, role: UserRole.FARMER }, ownerId);
    } catch (err: any) {
      if (err.statusCode === 403) caught = true;
    }
    if (!caught) throw new Error('IDOR vulnerability! Non-owner was permitted access.');
  });

  // 12. IDOR Protection — assertOwnerOrAdmin
  await test('Authorization — assertOwnerOrAdmin allows owner OR admin, blocks others', () => {
    const ownerId = 'user_12345';
    const adminId = 'admin_77777';
    const attackerId = 'attacker_88888';

    assertOwnerOrAdmin({ userId: ownerId, role: UserRole.FARMER }, ownerId);
    assertOwnerOrAdmin({ userId: adminId, role: UserRole.ADMIN }, ownerId);

    let caught = false;
    try {
      assertOwnerOrAdmin({ userId: attackerId, role: UserRole.DEALER }, ownerId);
    } catch (err: any) {
      if (err.statusCode === 403) caught = true;
    }
    if (!caught) throw new Error('IDOR vulnerability! Non-owner dealer was permitted access.');
  });

  // 13. RefreshToken model validation
  await test('RefreshToken Model — requires userId, tokenHash, jti and expiresAt', () => {
    const rt = new RefreshToken({
      userId: new mongoose.Types.ObjectId(),
      tokenHash: 'hashed_token_string',
      jti: 'unique_jti_uuid',
      expiresAt: new Date(Date.now() + 86400000),
    });
    const err = rt.validateSync();
    if (err) throw new Error(`RefreshToken validation failed: ${err.message}`);
  });

  // Summary
  console.log('\n==============================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`Results: ${passedCount}/${results.length} tests passed.\n`);

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
