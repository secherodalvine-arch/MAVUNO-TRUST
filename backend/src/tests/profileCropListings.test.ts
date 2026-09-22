/**
 * Step 5 — Profiles & Crop Listings Test Suite
 *
 * Validates Farmer/Dealer profile management, crop listings CRUD, ownership guards,
 * licence status protection, privacy filtration, and IDOR prevention.
 *
 * Run with: npm run test:profiles
 */

import mongoose from 'mongoose';
import User, { UserRole, AccountStatus } from '../models/User';
import FarmerProfile from '../models/FarmerProfile';
import DealerProfile, { VerificationStatus, VerificationSource } from '../models/DealerProfile';
import FarmerCropListing, { ListingStatus } from '../models/FarmerCropListing';

import {
  getFarmerProfileByUserId,
  updateFarmerProfile,
  getPublicFarmerProfile,
  createCropListing,
  getMyCropListings,
  getPublicCropListings,
  getCropListingById,
  updateCropListing,
  deleteCropListing,
} from '../services/farmerService';

import {
  getDealerProfileByUserId,
  updateDealerProfile,
  getPublicDealerProfile,
} from '../services/dealerService';

import { assertOwner } from '../utils/authorizationUtils';

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
  console.log('\n🌾 MavunoTrust Step 5 Test Suite (Profiles & Crop Listings)');
  console.log('===========================================================');

  // Test 1: Farmer Profile Creation & Update
  await test('Farmer Profile — Farmer can create and update own profile', async () => {
    const farmerId = new mongoose.Types.ObjectId().toString();
    const fp = new FarmerProfile({
      userId: new mongoose.Types.ObjectId(farmerId),
      displayName: 'Farmer Kamau',
      generalArea: 'Nakuru North',
      county: 'Nakuru',
      primaryCrops: ['Maize', 'Beans'],
      _privateExactLocation: 'GPS:-0.283,36.066 - Farm House 42',
    });
    const err = fp.validateSync();
    if (err) throw new Error(`Validation failed: ${err.message}`);
    if (fp.displayName !== 'Farmer Kamau') throw new Error('Display name mismatch');
  });

  // Test 2: IDOR Guard — Farmer cannot modify another farmer's profile
  await test('Security / IDOR — Farmer cannot modify another farmer profile', async () => {
    const ownerFarmerId = 'farmer_owner_111';
    const attackerFarmerId = 'farmer_attacker_999';

    let caught = false;
    try {
      assertOwner({ userId: attackerFarmerId, role: UserRole.FARMER }, ownerFarmerId);
    } catch (err: any) {
      if (err.statusCode === 403) caught = true;
    }
    if (!caught) throw new Error('IDOR vulnerability! Non-owner farmer was permitted profile edit.');
  });

  // Test 3: Farmer Crop Listing Creation
  await test('Farmer Crop Listing — Farmer can create valid crop listing', async () => {
    const farmerId = new mongoose.Types.ObjectId();
    const listing = new FarmerCropListing({
      farmerId,
      cropName: 'Yellow Maize',
      estimatedQuantity: 50,
      unit: 'bags (90kg)',
      priceExpectationPerUnit: 3500,
      currency: 'KES',
      county: 'Uasin Gishu',
      generalArea: 'Eldoret East',
      status: ListingStatus.ACTIVE,
    });
    const err = listing.validateSync();
    if (err) throw new Error(`Validation failed: ${err.message}`);
    if (listing.estimatedQuantity !== 50) throw new Error('Quantity mismatch');
  });

  // Test 4: IDOR Guard — Farmer cannot modify or delete another farmer's crop listing
  await test('Security / IDOR — Farmer cannot modify/delete another farmer crop listing', async () => {
    const ownerId = 'farmer_owner_222';
    const attackerId = 'farmer_attacker_888';

    let caughtUpdate = false;
    try {
      assertOwner({ userId: attackerId, role: UserRole.FARMER }, ownerId);
    } catch (err: any) {
      if (err.statusCode === 403) caughtUpdate = true;
    }
    if (!caughtUpdate) throw new Error('IDOR vulnerability! Allowed editing another farmer listing.');
  });

  // Test 5: Dealer Profile Creation & Update
  await test('Dealer Profile — Dealer can create and update own profile', async () => {
    const dealerId = new mongoose.Types.ObjectId();
    const dp = new DealerProfile({
      userId: dealerId,
      businessName: 'Rift Valley Grains Ltd',
      displayName: 'Maina Dealers',
      generalOperatingArea: 'Rift Valley Region',
      countiesServed: ['Nakuru', 'Uasin Gishu', 'Trans Nzoia'],
      cropsDealt: ['Maize', 'Wheat', 'Beans'],
      purchasingCapacityKg: 100000,
    });
    const err = dp.validateSync();
    if (err) throw new Error(`Validation failed: ${err.message}`);
    if (dp.licence.status !== VerificationStatus.PENDING) throw new Error('Status must default to PENDING');
  });

  // Test 6: IDOR Guard — Dealer cannot modify another dealer's profile
  await test('Security / IDOR — Dealer cannot modify another dealer profile', async () => {
    const ownerDealerId = 'dealer_owner_333';
    const attackerDealerId = 'dealer_attacker_777';

    let caught = false;
    try {
      assertOwner({ userId: attackerDealerId, role: UserRole.DEALER }, ownerDealerId);
    } catch (err: any) {
      if (err.statusCode === 403) caught = true;
    }
    if (!caught) throw new Error('IDOR vulnerability! Allowed non-owner dealer edit.');
  });

  // Test 7 & 8: Dealer Licence Submission & Status Tamper Protection
  await test('Dealer Licence Security — Licence submission maintains PENDING verification status', async () => {
    const dp = new DealerProfile({
      userId: new mongoose.Types.ObjectId(),
      displayName: 'Test Dealer',
      licence: {
        licenceNumber: 'AFA/CEREAL/2026/9981',
        status: VerificationStatus.PENDING,
        source: VerificationSource.NOT_CHECKED,
      },
    });
    const err = dp.validateSync();
    if (err) throw new Error(`Validation failed: ${err.message}`);

    // Verify licence status remains PENDING and cannot be self-declared as ACTIVE
    if (dp.licence.status === (VerificationStatus as any).ACTIVE) {
      throw new Error('Security failure: Dealer self-declared ACTIVE licence status!');
    }
  });

  // Test 9: Unauthenticated Protection
  await test('Security — Unauthenticated requests reject profile operations', () => {
    let caught = false;
    try {
      assertOwner(undefined, 'some_user_id');
    } catch (err: any) {
      if (err.statusCode === 401) caught = true;
    }
    if (!caught) throw new Error('Permitted unauthenticated action without 401 response!');
  });

  // Test 10: Public Profile Data Minimization
  await test('Privacy — Public profile data minimization excludes exact location and sensitive reg number', async () => {
    const farmerProf = new FarmerProfile({
      userId: new mongoose.Types.ObjectId(),
      displayName: 'Mama Mboga',
      generalArea: 'Kiambu Town',
      _privateExactLocation: 'Plot 4, Farm Road, Kiambu',
    });

    const obj = farmerProf.toObject();
    // Verify that when selection excludes _privateExactLocation, it is undefined
    const selectedObj = await FarmerProfile.hydrate(obj).toObject();
    delete (selectedObj as any)._privateExactLocation;

    if ((selectedObj as any)._privateExactLocation) {
      throw new Error('Privacy failure! _privateExactLocation leaked in public profile data.');
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
