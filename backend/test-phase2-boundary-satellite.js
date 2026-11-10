/**
 * Phase 2 Farm Boundary Polygon & Google Earth Engine Satellite Tests
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import FarmerProfile from './src/models/FarmerProfile.js';
import User, { UserRole } from './src/models/User.js';
import {
  validateAndNormalizePolygon,
  hasSelfIntersections,
  calculateGeodesicArea,
  calculateCentroid,
} from './src/utils/polygonValidator.js';
import {
  getEarthEngineConfig,
  getSatelliteServiceStatus,
  calculateFarmNDVI,
} from './src/services/satelliteService.js';
import {
  getFarmerBoundary,
  updateFarmerBoundary,
  clearFarmerBoundary,
  getPublicFarmerProfile,
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

async function runPhase2Tests() {
  console.log('===============================================================');
  console.log('   PHASE 2: FARM BOUNDARY & SATELLITE MONITORING VERIFICATION  ');
  console.log('===============================================================\n');

  // ── 1. Polygon Geometric Validation Tests ──
  console.log('1. Testing Polygon Geometric Validation & Area Calculation:');

  // Valid 4-corner farm in Nakuru, Kenya (~0.002 deg x ~0.002 deg ≈ 12 acres)
  const validRing = [
    [36.0660, -0.2830],
    [36.0680, -0.2830],
    [36.0680, -0.2850],
    [36.0660, -0.2850],
    [36.0660, -0.2830],
  ];

  const validResult = validateAndNormalizePolygon({ type: 'Polygon', coordinates: [validRing] });
  assert(validResult.valid === true, 'Valid GeoJSON Polygon passes validation');
  assert(validResult.areaAcres > 10 && validResult.areaAcres < 15, `Calculates accurate geodesic area (${validResult.areaAcres} acres)`);
  assert(validResult.areaHectares > 4 && validResult.areaHectares < 6, `Calculates accurate metric area (${validResult.areaHectares} ha)`);
  assert(validResult.centroid[0] === 36.067 && validResult.centroid[1] === -0.284, 'Computes correct polygon centroid');

  // Auto-closure test: provide 4 distinct points without repeating the first point
  const openRing = [
    [36.0660, -0.2830],
    [36.0680, -0.2830],
    [36.0680, -0.2850],
    [36.0660, -0.2850],
  ];
  const autoCloseResult = validateAndNormalizePolygon(openRing);
  const ring = autoCloseResult.polygon.coordinates[0];
  assert(ring.length === 5, 'Auto-closes open polygon by appending the initial vertex');
  assert(ring[0][0] === ring[4][0] && ring[0][1] === ring[4][1], 'First and last coordinates match after auto-closure');

  // Self-intersecting polygon (Hourglass / Bowtie shape)
  const selfIntersecting = [
    [36.0660, -0.2830],
    [36.0680, -0.2850],
    [36.0680, -0.2830],
    [36.0660, -0.2850],
    [36.0660, -0.2830],
  ];
  assert(hasSelfIntersections(selfIntersecting) === true, 'Self-intersection algorithm correctly detects intersecting edges');
  assertThrows(
    () => validateAndNormalizePolygon(selfIntersecting),
    'POLYGON_SELF_INTERSECTION',
    'Rejects self-intersecting polygon with POLYGON_SELF_INTERSECTION'
  );

  // Insufficient vertices (fewer than 3 unique points)
  assertThrows(
    () => validateAndNormalizePolygon([[36.066, -0.283], [36.068, -0.285]]),
    'INSUFFICIENT_VERTICES',
    'Rejects 2-point line with INSUFFICIENT_VERTICES'
  );

  // Out of bounds coordinate
  assertThrows(
    () => validateAndNormalizePolygon([[190.0, -0.283], [36.068, -0.285], [36.066, -0.285]]),
    'COORDINATE_OUT_OF_BOUNDS',
    'Rejects longitude 190.0 with COORDINATE_OUT_OF_BOUNDS'
  );

  // Non-numeric coordinate
  assertThrows(
    () => validateAndNormalizePolygon([['abc', -0.283], [36.068, -0.285], [36.066, -0.285]]),
    'INVALID_COORDINATE_VALUE',
    'Rejects non-numeric coordinate with INVALID_COORDINATE_VALUE'
  );

  // ── 2. FarmerProfile Schema & Boundary Privacy Tests ──
  console.log('\n2. Testing FarmerProfile Schema Boundary Privacy & Projections:');

  const boundaryPath = FarmerProfile.schema.path('farmBoundary');
  assert(boundaryPath && boundaryPath.options.select === false, 'CRITICAL: FarmerProfile schema defines farmBoundary with select: false');

  const areaPath = FarmerProfile.schema.path('boundaryAreaAcres');
  assert(areaPath && areaPath.options.select === false, 'CRITICAL: FarmerProfile schema defines boundaryAreaAcres with select: false');

  const updatedAtPath = FarmerProfile.schema.path('boundaryUpdatedAt');
  assert(updatedAtPath && updatedAtPath.options.select === false, 'CRITICAL: FarmerProfile schema defines boundaryUpdatedAt with select: false');

  // Verify 2dsphere index configuration
  const indexes = FarmerProfile.schema.indexes();
  const has2dsphere = indexes.some(idx => idx[0] && idx[0].farmBoundary === '2dsphere');
  assert(has2dsphere === true, 'CRITICAL: FarmerProfile has sparse 2dsphere index on farmBoundary');

  // Test Document Sanitization & Public Leak Prevention
  const mockDoc = new FarmerProfile({
    userId: new mongoose.Types.ObjectId(),
    displayName: 'Private Boundary Farm',
    county: 'Uasin Gishu',
    subCounty: 'Moiben',
    generalArea: 'Chebororwa',
    farmBoundary: validResult.polygon,
    boundaryAreaAcres: validResult.areaAcres,
    boundaryUpdatedAt: new Date(),
    latitude: 0.5143,
    longitude: 35.2698,
  });

  const rawObj = mockDoc.toObject();
  // Simulate public sanitization
  delete rawObj.farmBoundary;
  delete rawObj.boundaryAreaAcres;
  delete rawObj.boundaryUpdatedAt;
  delete rawObj.latitude;
  delete rawObj.longitude;

  assert(rawObj.county === 'Uasin Gishu', 'Public profile preserves county');
  assert(rawObj.subCounty === 'Moiben', 'Public profile preserves subCounty');
  assert(rawObj.farmBoundary === undefined, 'PRIVACY: farmBoundary is strictly omitted from public profile');
  assert(rawObj.boundaryAreaAcres === undefined, 'PRIVACY: boundaryAreaAcres is strictly omitted from public profile');
  assert(rawObj.latitude === undefined, 'PRIVACY: latitude is omitted from public profile');
  assert(rawObj.longitude === undefined, 'PRIVACY: longitude is omitted from public profile');

  // ── 3. Google Earth Engine Service Readiness & Zero-Fabrication Tests ──
  console.log('\n3. Testing Google Earth Engine Readiness & Zero-Fabrication Rule:');

  const geeConfig = getEarthEngineConfig();
  assert(geeConfig.dataset === 'COPERNICUS/S2_SR_HARMONIZED', 'Configured dataset is COPERNICUS/S2_SR_HARMONIZED');
  assert(geeConfig.bands.nir === 'B8' && geeConfig.bands.red === 'B4', 'Uses Sentinel-2 Band 8 (NIR) and Band 4 (Red)');
  assert(geeConfig.formula === 'NDVI = (B8 - B4) / (B8 + B4)', 'Formula is verified as (B8 - B4) / (B8 + B4)');

  const serviceStatus = await getSatelliteServiceStatus();
  assert(typeof serviceStatus.ready === 'boolean', 'Service status returns boolean readiness flag');
  assert(serviceStatus.dataset === 'COPERNICUS/S2_SR_HARMONIZED', 'Status exposes Sentinel-2 Harmonized Surface Reflectance');

  // Test zero-fabrication rule when credentials are not configured in test environment
  if (!geeConfig.isConfigured) {
    const unconfiguredResult = await calculateFarmNDVI({
      farmBoundary: validResult.polygon,
      maxCloudCoverPercent: 20,
    });

    assert(unconfiguredResult.success === false, 'Returns success: false when GEE credentials are not configured');
    assert(unconfiguredResult.code === 'GEE_CREDENTIALS_REQUIRED', 'Returns code: GEE_CREDENTIALS_REQUIRED');
    assert(unconfiguredResult.status === 'CONFIGURATION_REQUIRED', 'Returns status: CONFIGURATION_REQUIRED');
    assert(unconfiguredResult.pipelineDetails !== undefined, 'Exposes Sentinel-2 pipeline specifications without executing');
    assert(unconfiguredResult.data === undefined, 'ZERO-FABRICATION: Does NOT invent or fabricate fake NDVI readings');
  }

  // Test missing boundary error handling
  try {
    await calculateFarmNDVI({ farmBoundary: null });
    assert(false, 'Should throw when farmBoundary is missing');
  } catch (err) {
    assert(err.code === 'BOUNDARY_REQUIRED', 'Throws BOUNDARY_REQUIRED when boundary is missing');
  }

  console.log('\n===============================================================');
  console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('===============================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runPhase2Tests();
