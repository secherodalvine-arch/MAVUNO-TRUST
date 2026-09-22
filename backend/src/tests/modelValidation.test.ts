/**
 * Model Validation Tests — MavunoTrust Step 3
 *
 * These tests validate Mongoose schema-level rules using clearly labelled
 * test data only. No real farmer/dealer data, no government records.
 *
 * Run with: node --experimental-vm-modules src/tests/modelValidation.test.js
 * (or via Jest once configured in Step 4+)
 *
 * NOTE: These tests use in-memory validation only — no live MongoDB required.
 * They test Mongoose model validation, not database connectivity.
 */

import mongoose from 'mongoose';
import User, { UserRole, AccountStatus } from '../models/User';
import { VerificationStatus, VerificationSource } from '../models/DealerProfile';
import DealerVerification from '../models/DealerVerification';
import Rating from '../models/Rating';
import Transaction, { TransactionStatus, DeliveryStatus, PaymentStatus } from '../models/Transaction';
import FarmerExpense, { ExpenseCategory } from '../models/FarmerExpense';
import Complaint, { ComplaintCategory, ComplaintStatus } from '../models/Complaint';
import FarmerRightsContent, { RightsCategory, RightsSection } from '../models/FarmerRightsContent';
import { calculateBusinessMetrics } from '../services/businessCalculationService';
import {
  NotConfiguredVerificationProvider,
  VerificationResult,
} from '../services/verificationService';

// ── Simple Test Runner ────────────────────────────────────────────────────────

interface TestResult {
  name:    string;
  passed:  boolean;
  error?:  string;
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

function expect(actual: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected) throw new Error(`Expected "${expected}", got "${actual}"`);
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got "${actual}"`);
    },
    toContain: (substr: string) => {
      if (typeof actual !== 'string' || !actual.includes(substr))
        throw new Error(`Expected "${actual}" to contain "${substr}"`);
    },
    toBeGreaterThan: (n: number) => {
      if (typeof actual !== 'number' || actual <= n)
        throw new Error(`Expected ${actual} to be greater than ${n}`);
    },
    toBeLessThanOrEqual: (n: number) => {
      if (typeof actual !== 'number' || actual > n)
        throw new Error(`Expected ${actual} to be <= ${n}`);
    },
  };
}

async function runTests() {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  MavunoTrust — Step 3 Model Validation Tests');
  console.log('══════════════════════════════════════════════════\n');

  // ── 1. User — invalid role rejected ────────────────────────────────────────
  await test('User: invalid role is rejected', async () => {
    const user = new User({
      fullName:     'Test Farmer [TEST DATA]',
      email:        'test.farmer@test.invalid',
      passwordHash: '$2b$10$fakehashfortesting',
      role:         'INVALID_ROLE', // should fail
    });
    const err = user.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['role'].message).toContain('FARMER');
  });

  // ── 2. User — valid roles accepted ─────────────────────────────────────────
  await test('User: valid roles FARMER/DEALER/ADMIN accepted', async () => {
    for (const role of Object.values(UserRole)) {
      const user = new User({
        fullName:     `Test User ${role} [TEST DATA]`,
        email:        `test.${role.toLowerCase()}@test.invalid`,
        passwordHash: '$2b$10$fakehashfortesting',
        role,
      });
      const err = user.validateSync();
      // Role field should not have an error
      if (err?.errors['role']) throw new Error(`Role ${role} should be valid`);
    }
  });

  // ── 3. DealerVerification — invalid status rejected ─────────────────────────
  await test('DealerVerification: invalid status is rejected', async () => {
    const record = new DealerVerification({
      dealerId:      new mongoose.Types.ObjectId(),
      licenceNumber: 'TEST-LIC-001',
      status:        'MAYBE', // invalid
      source:        VerificationSource.AFA_DEMO,
    });
    const err = record.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['status'].message).toContain('ACTIVE');
  });

  // ── 4. DealerVerification — all valid statuses accepted ─────────────────────
  await test('DealerVerification: all VerificationStatus values are valid', async () => {
    for (const status of Object.values(VerificationStatus)) {
      const record = new DealerVerification({
        dealerId:      new mongoose.Types.ObjectId(),
        licenceNumber: 'TEST-LIC-001',
        status,
        source:        VerificationSource.AFA_DEMO,
      });
      const err = record.validateSync();
      if (err?.errors['status']) throw new Error(`Status ${status} should be valid`);
    }
  });

  // ── 5. Rating — out-of-range rating rejected ────────────────────────────────
  await test('Rating: rating of 0 is rejected (min is 1)', async () => {
    const rating = new Rating({
      transactionId:  new mongoose.Types.ObjectId(),
      reviewerId:     new mongoose.Types.ObjectId(),
      reviewedUserId: new mongoose.Types.ObjectId(),
      rating: 0,
    });
    const err = rating.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['rating']).toBeTruthy();
  });

  await test('Rating: rating of 6 is rejected (max is 5)', async () => {
    const rating = new Rating({
      transactionId:  new mongoose.Types.ObjectId(),
      reviewerId:     new mongoose.Types.ObjectId(),
      reviewedUserId: new mongoose.Types.ObjectId(),
      rating: 6,
    });
    const err = rating.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['rating']).toBeTruthy();
  });

  await test('Rating: rating of 1–5 (integer) accepted', async () => {
    for (const n of [1, 2, 3, 4, 5]) {
      const rating = new Rating({
        transactionId:  new mongoose.Types.ObjectId(),
        reviewerId:     new mongoose.Types.ObjectId(),
        reviewedUserId: new mongoose.Types.ObjectId(),
        rating: n,
      });
      const err = rating.validateSync();
      if (err?.errors['rating']) throw new Error(`Rating ${n} should be valid`);
    }
  });

  // ── 6. Transaction — required fields validated ──────────────────────────────
  await test('Transaction: missing required fields are caught', async () => {
    const tx = new Transaction({});
    const err = tx.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['farmerId']).toBeTruthy();
    expect(err!.errors['dealerId']).toBeTruthy();
    expect(err!.errors['listingId']).toBeTruthy();
    expect(err!.errors['quantity']).toBeTruthy();
    expect(err!.errors['agreedPricePerUnit']).toBeTruthy();
    expect(err!.errors['totalAgreedValue']).toBeTruthy();
  });

  await test('Transaction: invalid status is rejected', async () => {
    const tx = new Transaction({
      farmerId:           new mongoose.Types.ObjectId(),
      dealerId:           new mongoose.Types.ObjectId(),
      listingId:          new mongoose.Types.ObjectId(),
      acceptedOfferId:    new mongoose.Types.ObjectId(),
      cropName:           'Maize',
      quantity:           1000,
      unit:               'kg',
      agreedPricePerUnit: 50,
      currency:           'KES',
      totalAgreedValue:   50000,
      status:             'INVALID_STATUS',
    });
    const err = tx.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['status']).toBeTruthy();
  });

  // ── 7. FarmerExpense — requires farmerId ────────────────────────────────────
  await test('FarmerExpense: missing farmerId is caught', async () => {
    const expense = new FarmerExpense({
      category:    ExpenseCategory.SEEDS,
      description: 'Test seed purchase [TEST DATA]',
      amount:      5000,
      currency:    'KES',
      expenseDate: new Date(),
    });
    const err = expense.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['farmerId']).toBeTruthy();
  });

  await test('FarmerExpense: invalid category is rejected', async () => {
    const expense = new FarmerExpense({
      farmerId:    new mongoose.Types.ObjectId(),
      category:    'FAKE_CATEGORY',
      description: 'Test expense [TEST DATA]',
      amount:      100,
      currency:    'KES',
      expenseDate: new Date(),
    });
    const err = expense.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['category']).toBeTruthy();
  });

  // ── 8. Complaint — category validation ─────────────────────────────────────
  await test('Complaint: invalid category is rejected', async () => {
    const complaint = new Complaint({
      reporterId:  new mongoose.Types.ObjectId(),
      category:    'FAKE_COMPLAINT_TYPE',
      description: 'A'.repeat(25),
    });
    const err = complaint.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['category']).toBeTruthy();
  });

  await test('Complaint: all valid categories accepted', async () => {
    for (const category of Object.values(ComplaintCategory)) {
      const complaint = new Complaint({
        reporterId:  new mongoose.Types.ObjectId(),
        category,
        description: 'This is a test complaint description [TEST DATA] minimum length',
      });
      const err = complaint.validateSync();
      if (err?.errors['category']) throw new Error(`Category ${category} should be valid`);
    }
  });

  // ── 9. FarmerRightsContent — officialSource required ───────────────────────
  await test('FarmerRightsContent: missing officialSource is rejected', async () => {
    const content = new FarmerRightsContent({
      title:        'Test Right [TEST DATA]',
      category:     RightsCategory.ECONOMIC_PROTECTION,
      section:      RightsSection.BEFORE_SELLING,
      whatYouCanDo: 'You can do this.',
      // officialSource OMITTED — should fail
    });
    const err = content.validateSync();
    expect(err).toBeTruthy();
    expect(err!.errors['officialSource']).toBeTruthy();
  });

  // ── 10. BusinessCalculationService ─────────────────────────────────────────
  await test('BusinessCalc: calculates correct break-even price', () => {
    const result = calculateBusinessMetrics({
      expenses: [
        { amount: 10000, currency: 'KES' }, // seeds
        { amount: 5000,  currency: 'KES' }, // labour
        { amount: 2000,  currency: 'KES' }, // transport
      ],
      estimatedQuantity: 1000, // kg
      unit:              'kg',
      currency:          'KES',
    });
    // Total: 17000 / 1000 kg = 17 KES/kg
    expect(result.totalProductionCost).toBe(17000);
    expect(result.costPerUnit).toBe(17);
    expect(result.breakEvenPricePerUnit).toBe(17);
    expect(result.disclaimer).toBeTruthy();
  });

  await test('BusinessCalc: includes profit/loss when market price provided', () => {
    const result = calculateBusinessMetrics({
      expenses: [{ amount: 10000, currency: 'KES' }],
      estimatedQuantity: 1000,
      unit:              'kg',
      currency:          'KES',
      marketPricePerUnit: 15, // KES/kg market rate
    });
    // Revenue: 15 * 1000 = 15000 | Cost: 10000 | Profit: 5000
    expect(result.estimatedRevenue).toBe(15000);
    expect(result.estimatedProfitLoss).toBe(5000);
    expect(result.disclaimer).toBeTruthy();
  });

  await test('BusinessCalc: zero quantity throws an error', () => {
    let threw = false;
    try {
      calculateBusinessMetrics({
        expenses: [{ amount: 5000, currency: 'KES' }],
        estimatedQuantity: 0,
        unit: 'kg',
        currency: 'KES',
      });
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('Expected error for zero quantity');
  });

  // ── 11. VerificationService — not-configured provider returns UNABLE_TO_VERIFY
  await test('VerificationService: NotConfigured provider returns UNABLE_TO_VERIFY', async () => {
    const provider = new NotConfiguredVerificationProvider();
    const result: VerificationResult = await provider.verifyLicence('TEST-LIC-0001');
    expect(result.status).toBe(VerificationStatus.UNABLE_TO_VERIFY);
    expect(result.isDemoData).toBe(true);
  });

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n──────────────────────────────────────────────────');
  const passed = results.filter(r => r.passed).length;
  const total  = results.length;
  console.log(`  Results: ${passed}/${total} tests passed`);

  if (passed < total) {
    console.log('\n  Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`    ✗ ${r.name}`);
      if (r.error) console.log(`      → ${r.error}`);
    });
    console.log('');
    process.exit(1);
  } else {
    console.log('  All tests passed ✓\n');
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
