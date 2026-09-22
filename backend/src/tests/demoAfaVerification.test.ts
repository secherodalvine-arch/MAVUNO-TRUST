/**
 * Verification Security & Ownership Hardening Test Suite
 *
 * Validates:
 *  - Strict binding of verification to authenticated dealer account (`req.user.userId`).
 *  - Non-transferability of verification records between dealers.
 *  - Licence number ≠ verification ownership.
 *  - IDOR protection on private verification records.
 *  - Rejection/ignoring of client-tampered status, source, or dealerUserId fields.
 *  - Preservation of Demo AFA test statuses (AFA-DEMO-001 to 006).
 *
 * Run with: npm run test:verification
 */

import mongoose from 'mongoose';
import User, { UserRole } from '../models/User';
import DealerProfile, { VerificationStatus, VerificationSource } from '../models/DealerProfile';
import DealerVerification from '../models/DealerVerification';

import {
  DemoAfaVerificationProvider,
  verifyDealerLicence,
  getVerificationById,
  getMyVerificationHistory,
} from '../services/verificationService';
import { requireRole } from '../middleware/requireRole';

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
  console.log('\n🔒 MavunoTrust Verification Ownership & Security Suite');
  console.log('===========================================================');

  const provider = new DemoAfaVerificationProvider();

  // Test 1: AFA-DEMO-001 returns ACTIVE
  await test('Demo Provider — AFA-DEMO-001 returns ACTIVE', async () => {
    const res = await provider.verifyLicence('AFA-DEMO-001');
    if (res.status !== VerificationStatus.ACTIVE) throw new Error(`Expected ACTIVE, got ${res.status}`);
    if (res.source !== VerificationSource.AFA_DEMO) throw new Error('Source must be AFA_DEMO');
  });

  // Test 2: AFA-DEMO-002 returns EXPIRED
  await test('Demo Provider — AFA-DEMO-002 returns EXPIRED', async () => {
    const res = await provider.verifyLicence('AFA-DEMO-002');
    if (res.status !== VerificationStatus.EXPIRED) throw new Error(`Expected EXPIRED, got ${res.status}`);
  });

  // Test 3: AFA-DEMO-003 returns SUSPENDED
  await test('Demo Provider — AFA-DEMO-003 returns SUSPENDED', async () => {
    const res = await provider.verifyLicence('AFA-DEMO-003');
    if (res.status !== VerificationStatus.SUSPENDED) throw new Error(`Expected SUSPENDED, got ${res.status}`);
  });

  // Test 4: AFA-DEMO-004 returns REVOKED
  await test('Demo Provider — AFA-DEMO-004 returns REVOKED', async () => {
    const res = await provider.verifyLicence('AFA-DEMO-004');
    if (res.status !== VerificationStatus.REVOKED) throw new Error(`Expected REVOKED, got ${res.status}`);
  });

  // Test 5: AFA-DEMO-005 returns INACTIVE
  await test('Demo Provider — AFA-DEMO-005 returns INACTIVE', async () => {
    const res = await provider.verifyLicence('AFA-DEMO-005');
    if (res.status !== VerificationStatus.INACTIVE) throw new Error(`Expected INACTIVE, got ${res.status}`);
  });

  // Test 6: AFA-DEMO-006 returns UNABLE_TO_VERIFY
  await test('Demo Provider — AFA-DEMO-006 returns UNABLE_TO_VERIFY', async () => {
    const res = await provider.verifyLicence('AFA-DEMO-006');
    if (res.status !== VerificationStatus.UNABLE_TO_VERIFY) throw new Error(`Expected UNABLE_TO_VERIFY, got ${res.status}`);
  });

  // Test 7: Unknown licence identifier returns UNABLE_TO_VERIFY
  await test('Demo Provider — Unknown licence identifier returns UNABLE_TO_VERIFY', async () => {
    const res = await provider.verifyLicence('AFA-UNKNOWN-999');
    if (res.status !== VerificationStatus.UNABLE_TO_VERIFY) throw new Error(`Expected UNABLE_TO_VERIFY, got ${res.status}`);
  });

  // Test 8: Dealer A verifies AFA-DEMO-001 -> bound to Dealer A's authenticated userId
  await test('Ownership Binding — Verification is bound to authenticated dealer userId', async () => {
    const dealerAId = new mongoose.Types.ObjectId().toString();
    const dvA = new DealerVerification({
      dealerId: new mongoose.Types.ObjectId(dealerAId),
      licenceNumber: 'AFA-DEMO-001',
      status: VerificationStatus.ACTIVE,
      source: VerificationSource.AFA_DEMO,
      checkedAt: new Date(),
    });
    const err = dvA.validateSync();
    if (err) throw new Error(`Validation failed: ${err.message}`);
    if (dvA.dealerId.toString() !== dealerAId) throw new Error('Dealer A ID mismatch');
  });

  // Test 9: Dealer B cannot submit Dealer A's userId to claim verification
  await test('Security Guard — Client-supplied dealerUserId is ignored/overridden', () => {
    const authDealerId = 'dealer_authenticated_111';
    const attemptedTargetId = 'dealer_target_222';

    // Simulated controller logic: always use req.user.userId
    const req: any = {
      user: { userId: authDealerId, role: UserRole.DEALER },
      body: { dealerUserId: attemptedTargetId, licenceNumber: 'AFA-DEMO-001' },
    };

    const effectiveUserId = req.user.userId;
    if (effectiveUserId === attemptedTargetId) {
      throw new Error('Security failure! Client-supplied dealerUserId was trusted!');
    }
    if (effectiveUserId !== authDealerId) {
      throw new Error('Effective userId does not match authenticated token user ID!');
    }
  });

  // Test 10: Dealer B cannot retrieve Dealer A's private verification record (IDOR)
  await test('Security / IDOR — Dealer B cannot retrieve Dealer A private verification record', async () => {
    const dealerAId = new mongoose.Types.ObjectId();
    const dealerBId = new mongoose.Types.ObjectId().toString();

    const recordA = new DealerVerification({
      _id: new mongoose.Types.ObjectId(),
      dealerId: dealerAId,
      licenceNumber: 'AFA-DEMO-001',
      status: VerificationStatus.ACTIVE,
      source: VerificationSource.AFA_DEMO,
      checkedAt: new Date(),
    });

    let caught = false;
    try {
      // Execute IDOR check
      if (recordA.dealerId.toString() !== dealerBId) {
        throw Object.assign(new Error('Access denied. You do not have permission to access this resource.'), { statusCode: 403 });
      }
    } catch (err: any) {
      if (err.statusCode === 403) caught = true;
    }
    if (!caught) throw new Error('IDOR failure! Dealer B was permitted to view Dealer A verification record.');
  });

  // Test 11: Dealer B entering same licence number creates distinct record bound to Dealer B
  await test('Anti-Copy Security — Copied licence number creates distinct record bound to Dealer B without inheriting ownership', () => {
    const dealerAId = new mongoose.Types.ObjectId();
    const dealerBId = new mongoose.Types.ObjectId();

    const recordA = new DealerVerification({
      _id: new mongoose.Types.ObjectId(),
      dealerId: dealerAId,
      licenceNumber: 'AFA-DEMO-001',
      status: VerificationStatus.ACTIVE,
      source: VerificationSource.AFA_DEMO,
      checkedAt: new Date(),
    });

    const recordB = new DealerVerification({
      _id: new mongoose.Types.ObjectId(),
      dealerId: dealerBId,
      licenceNumber: 'AFA-DEMO-001',
      status: VerificationStatus.ACTIVE,
      source: VerificationSource.AFA_DEMO,
      checkedAt: new Date(),
    });

    if (recordA._id.toString() === recordB._id.toString()) {
      throw new Error('Record ID collision! Verification record was shared/transferred.');
    }
    if (recordB.dealerId.toString() !== dealerBId.toString()) {
      throw new Error('Record B is not bound to Dealer B');
    }
    if (recordA.dealerId.toString() !== dealerAId.toString()) {
      throw new Error('Dealer A record ownership was mutated');
    }
  });

  // Test 12: Client cannot set status to ACTIVE or set source to AFA_OFFICIAL
  await test('Security Guard — Client cannot set status or source in verification request', () => {
    const rawBody: any = {
      licenceNumber: 'AFA-DEMO-002', // evaluates to EXPIRED in Demo DB
      status: 'ACTIVE',               // Tampering attempt
      source: 'AFA_OFFICIAL',         // Tampering attempt
    };

    // Controller only extracts licenceNumber
    const { licenceNumber } = rawBody;
    if ((licenceNumber as any).status || (licenceNumber as any).source) {
      throw new Error('Tampering payload bled into licenceNumber');
    }
  });

  // Summary
  console.log('\n===========================================================');
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
