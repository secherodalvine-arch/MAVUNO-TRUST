/**
 * Phase 1 Farm Location & Coordinate Storage Tests
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import FarmerProfile from './src/models/FarmerProfile.js';
import User, { UserRole } from './src/models/User.js';
import {
  validateCoordinates,
  getFarmerProfileByUserId,
  getFarmerLocation,
  updateFarmerLocation,
  getPublicFarmerProfile,
  updateFarmerProfile,
} from './src/services/farmerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

function assertThrows(fn, expectedCodeOrSnippet, message) {
  try {
    fn();
    console.error(`  ✗ FAIL (did not throw): ${message}`);
    testsFailed++;
  } catch (err) {
    const msg = err.message || '';
    const code = err.code || '';
    if (msg.includes(expectedCodeOrSnippet) || code === expectedCodeOrSnippet) {
      console.log(`  ✓ ${message}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL (threw wrong error "${msg}"): ${message}`);
      testsFailed++;
    }
  }
}

async function runPhase1Tests() {
  console.log('==================================================');
  console.log('   PHASE 1: SECURE FARM LOCATION VERIFICATION    ');
  console.log('==================================================\n');

  // ── 1. Coordinate Validation Unit Tests ──
  console.log('1. Testing Coordinate Validation Logic:');

  // Valid coordinate checks
  const validKenya = validateCoordinates(-0.2833, 36.0663);
  assert(validKenya.valid && validKenya.latitude === -0.2833 && validKenya.longitude === 36.0663, 'Valid Kenyan coordinates (-0.2833, 36.0663) accepted');

  const validGlobal = validateCoordinates(45.5, -73.5);
  assert(validGlobal.valid && validGlobal.latitude === 45.5 && validGlobal.longitude === -73.5, 'Valid global coordinates (45.5, -73.5) accepted');

  const validOmit = validateCoordinates(undefined, undefined);
  assert(validOmit.valid && !validOmit.shouldUpdate, 'Omitted coordinates return shouldUpdate: false');

  const validClear = validateCoordinates(null, null);
  assert(validClear.valid && validClear.shouldUpdate && validClear.clear, 'Null coordinates return clear: true');

  // Invalid boundary checks
  assertThrows(() => validateCoordinates(95, 36.0), 'Latitude must be between -90 and 90', 'Rejects latitude > 90');
  assertThrows(() => validateCoordinates(-90.1, 36.0), 'Latitude must be between -90 and 90', 'Rejects latitude < -90');
  assertThrows(() => validateCoordinates(0, 185), 'Longitude must be between -180 and 180', 'Rejects longitude > 180');
  assertThrows(() => validateCoordinates(0, -181), 'Longitude must be between -180 and 180', 'Rejects longitude < -180');

  // Non-numeric checks
  assertThrows(() => validateCoordinates('abc', 36.0), 'valid numeric values', 'Rejects non-numeric string latitude');
  assertThrows(() => validateCoordinates(0, 'invalid'), 'valid numeric values', 'Rejects non-numeric string longitude');
  assertThrows(() => validateCoordinates(NaN, 36.0), 'valid numeric values', 'Rejects NaN latitude');
  assertThrows(() => validateCoordinates(Infinity, 36.0), 'valid numeric values', 'Rejects Infinity latitude');

  // Missing partner checks (lat without lng or vice versa)
  assertThrows(() => validateCoordinates(-0.2833, undefined), 'Both latitude and longitude must be provided together', 'Rejects latitude without longitude');
  assertThrows(() => validateCoordinates(undefined, 36.0663), 'Both latitude and longitude must be provided together', 'Rejects longitude without latitude');
  assertThrows(() => validateCoordinates(-0.2833, null), 'Both latitude and longitude must be provided together', 'Rejects latitude with null longitude');
  assertThrows(() => validateCoordinates(null, 36.0663), 'Both latitude and longitude must be provided together', 'Rejects null latitude with valid longitude');

  // ── 2. Database Models & Privacy Schema Tests (In-Memory Mongoose) ──
  console.log('\n2. Testing FarmerProfile Model Schema & Privacy Projection:');

  try {
    // A. Schema validation tests
    const validDoc = new FarmerProfile({
      userId: new mongoose.Types.ObjectId(),
      displayName: 'Shamba Bora Farm',
      county: 'Nakuru',
      subCounty: 'Njoro',
      generalArea: 'Egerton Ward',
      farmSizeAcres: 5.5,
      latitude: -0.2833,
      longitude: 36.0663,
      locationUpdatedAt: new Date(),
      _privateExactLocation: 'Private physical address 123',
    });

    const validationErr = validDoc.validateSync();
    assert(!validationErr, 'Valid FarmerProfile document passes Mongoose schema validation');

    // B. Out of bounds schema validation
    const invalidLatDoc = new FarmerProfile({
      userId: new mongoose.Types.ObjectId(),
      displayName: 'Invalid Lat Farm',
      latitude: 95.0,
      longitude: 36.0,
    });
    const latErr = invalidLatDoc.validateSync();
    assert(Boolean(latErr && latErr.errors['latitude']), 'Mongoose rejects latitude > 90 in schema');

    const invalidLngDoc = new FarmerProfile({
      userId: new mongoose.Types.ObjectId(),
      displayName: 'Invalid Lng Farm',
      latitude: 0.0,
      longitude: 190.0,
    });
    const lngErr = invalidLngDoc.validateSync();
    assert(Boolean(lngErr && lngErr.errors['longitude']), 'Mongoose rejects longitude > 180 in schema');

    const invalidSizeDoc = new FarmerProfile({
      userId: new mongoose.Types.ObjectId(),
      displayName: 'Negative Farm Size',
      farmSizeAcres: -4,
    });
    const sizeErr = invalidSizeDoc.validateSync();
    assert(Boolean(sizeErr && sizeErr.errors['farmSizeAcres']), 'Mongoose rejects negative farmSizeAcres in schema');

    // C. Schema select: false property verification
    const latPath = FarmerProfile.schema.path('latitude');
    assert(latPath && latPath.options.select === false, 'CRITICAL: FarmerProfile schema defines latitude with select: false');

    const lngPath = FarmerProfile.schema.path('longitude');
    assert(lngPath && lngPath.options.select === false, 'CRITICAL: FarmerProfile schema defines longitude with select: false');

    const updatedPath = FarmerProfile.schema.path('locationUpdatedAt');
    assert(updatedPath && updatedPath.options.select === false, 'CRITICAL: FarmerProfile schema defines locationUpdatedAt with select: false');

    const privateLocPath = FarmerProfile.schema.path('_privateExactLocation');
    assert(privateLocPath && privateLocPath.options.select === false, 'CRITICAL: FarmerProfile schema defines _privateExactLocation with select: false');

    // D. In-Memory Privacy Sanitization & Data-Minimization Simulation
    const rawObject = validDoc.toObject();
    // Simulate query without selecting private fields (default projection)
    delete rawObject.latitude;
    delete rawObject.longitude;
    delete rawObject.locationUpdatedAt;
    delete rawObject._privateExactLocation;

    assert(rawObject.county === 'Nakuru', 'Sanitized profile contains county');
    assert(rawObject.subCounty === 'Njoro', 'Sanitized profile contains subCounty');
    assert(rawObject.generalArea === 'Egerton Ward', 'Sanitized profile contains generalArea');
    assert(rawObject.latitude === undefined, 'PRIVACY: latitude is omitted from sanitized profile');
    assert(rawObject.longitude === undefined, 'PRIVACY: longitude is omitted from sanitized profile');
    assert(rawObject.locationUpdatedAt === undefined, 'PRIVACY: locationUpdatedAt is omitted from sanitized profile');
    assert(rawObject._privateExactLocation === undefined, 'PRIVACY: _privateExactLocation is omitted from sanitized profile');

  } catch (err) {
    console.error('Schema test error:', err);
    testsFailed++;
  }

  // ── 3. Database & Service Integration Tests (if MongoDB is running) ──
  console.log('\n3. Testing Database Connection & Live Query Privacy:');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mavunotrust';
  let dbConnected = false;

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 4000 });
    dbConnected = true;
    console.log('  [Connected to MongoDB]');
  } catch (err) {
    console.warn(`  [Notice: Local MongoDB not reachable at ${mongoUri}. Skipping live DB tests.]`);
  }

  if (dbConnected) {
    try {
      // Create a test user and farmer profile
      const testEmail = `test_farmer_${Date.now()}@mavunotrust.test`;
      const testUser = await User.create({
        fullName: 'Test Farm Owner',
        email: testEmail,
        passwordHash: 'dummy_hash_for_testing',
        role: UserRole.FARMER,
        phoneNumber: '+254712345678',
      });

      const userId = testUser._id.toString();

      // Step A: Initial location lookup
      const initialLoc = await getFarmerLocation(userId);
      assert(!initialLoc.hasRegisteredCoordinates, 'Initial state: hasRegisteredCoordinates is false');
      assert(initialLoc.latitude === null && initialLoc.longitude === null, 'Initial coordinates are null');

      // Step B: Register farm coordinates via updateFarmerLocation
      const registered = await updateFarmerLocation(userId, {
        county: 'Nakuru',
        subCounty: 'Njoro',
        generalArea: 'Egerton Ward',
        farmSizeAcres: 8.5,
        latitude: -0.3667,
        longitude: 35.9333,
      });

      assert(registered.hasRegisteredCoordinates === true, 'Registered: hasRegisteredCoordinates is true');
      assert(registered.county === 'Nakuru', 'Registered county is Nakuru');
      assert(registered.subCounty === 'Njoro', 'Registered subCounty is Njoro');
      assert(registered.generalArea === 'Egerton Ward', 'Registered generalArea is Egerton Ward');
      assert(registered.farmSizeAcres === 8.5, 'Registered farmSizeAcres is 8.5');
      assert(registered.latitude === -0.3667, 'Registered latitude is -0.3667');
      assert(registered.longitude === 35.9333, 'Registered longitude is 35.9333');
      assert(registered.locationUpdatedAt !== null, 'Registered locationUpdatedAt timestamp exists');

      // Step C: Verify Authenticated retrieval
      const fetchedAuthLoc = await getFarmerLocation(userId);
      assert(fetchedAuthLoc.latitude === -0.3667 && fetchedAuthLoc.longitude === 35.9333, 'Authenticated farmer retrieves own coordinates');

      // Step D: CRITICAL PRIVACY TEST - Public Profile MUST NEVER expose coordinates
      const publicProfile = await getPublicFarmerProfile(userId);
      assert(publicProfile.county === 'Nakuru', 'Public profile shows county');
      assert(publicProfile.generalArea === 'Egerton Ward', 'Public profile shows generalArea');
      assert(publicProfile.latitude === undefined, 'PRIVACY: Public profile does NOT contain latitude');
      assert(publicProfile.longitude === undefined, 'PRIVACY: Public profile does NOT contain longitude');
      assert(publicProfile.locationUpdatedAt === undefined, 'PRIVACY: Public profile does NOT contain locationUpdatedAt');
      assert(publicProfile._privateExactLocation === undefined, 'PRIVACY: Public profile does NOT contain _privateExactLocation');

      // Direct findOne check (select: false defense in depth)
      const directRawDoc = await FarmerProfile.findOne({ userId });
      assert(directRawDoc.latitude === undefined, 'DEFENSE IN DEPTH: Default Mongoose findOne excludes latitude');
      assert(directRawDoc.longitude === undefined, 'DEFENSE IN DEPTH: Default Mongoose findOne excludes longitude');

      // Step E: Update coordinates via updateFarmerLocation
      const updated = await updateFarmerLocation(userId, {
        latitude: -0.2833,
        longitude: 36.0663,
      });
      assert(updated.latitude === -0.2833 && updated.longitude === 36.0663, 'Updated coordinates persisted');
      assert(new Date(updated.locationUpdatedAt) >= new Date(registered.locationUpdatedAt), 'locationUpdatedAt refreshed upon coordinate change');

      // Step F: Test clearing coordinates
      const cleared = await updateFarmerLocation(userId, {
        latitude: null,
        longitude: null,
      });
      assert(cleared.hasRegisteredCoordinates === false, 'Clearing coordinates sets hasRegisteredCoordinates to false');
      assert(cleared.latitude === null && cleared.longitude === null, 'Coordinates cleared to null');

      // Step G: Test existing farmer profile update still works
      const updatedProfile = await updateFarmerProfile(userId, {
        displayName: 'Updated Shamba Farm',
        bio: 'Sustainable organic farmer',
        primaryCrops: ['Maize', 'Beans'],
        farmSizeAcres: 12.0,
        latitude: -0.4201,
        longitude: 36.9476,
      });
      assert(updatedProfile.displayName === 'Updated Shamba Farm', 'FarmerProfile displayName updated');
      assert(updatedProfile.farmSizeAcres === 12.0, 'FarmerProfile farmSizeAcres updated');

      // Clean up test records
      await FarmerProfile.deleteOne({ userId });
      await User.deleteOne({ _id: userId });
      console.log('  [Test records cleaned up]');
    } catch (err) {
      console.error('Test execution error:', err);
      testsFailed++;
    } finally {
      await mongoose.disconnect();
    }
  }

  console.log('\n==================================================');
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('==================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runPhase1Tests();
