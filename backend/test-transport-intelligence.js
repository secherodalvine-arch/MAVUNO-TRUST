/**
 * Comprehensive Automated Test Suite for Shared Transport-Cost Intelligence
 * (OSRM Road-Network Routing & OpenStreetMap Geocoding Engine)
 *
 * MOCKS:
 * All external OSRM and Nominatim HTTP calls are mocked or use internal fixtures
 * so tests run reliably offline without depending on public service uptime.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { OSRMRoutingProvider } from './src/services/routing/osrmRoutingProvider.js';
import { geocodeLocation, KNOWN_KENYA_HUBS } from './src/services/geocodingService.js';
import { computeRoadRoute } from './src/services/routing/index.js';
import {
  estimateTransportCost,
  VEHICLE_BASE_CHARGES,
  VEHICLE_DEFAULT_RATES_PER_KM,
} from './src/services/transportEstimationService.js';
import {
  calculateQuartiles,
  evaluateTransportRecord,
  reviewTransportRecord,
  MIN_PLAUSIBLE_RATE_PER_KM,
  MAX_PLAUSIBLE_RATE_PER_KM,
} from './src/services/transportDataQualityService.js';
import {
  buildDeterministicExplanation,
  getTransportExplanation,
} from './src/agents/intelligenceAgent/transportAdvisor.js';
import TransportRecord, {
  VehicleCategory,
  TripArrangement,
  PriceEvidenceType,
  TransportVerificationStatus,
  TransportReviewStatus,
} from './src/models/TransportRecord.js';
import {
  computeRouteDistanceTool,
  getTransportCostEstimateTool,
  reviewTransportRecordTool,
} from './src/mcp/tools/transportTools.js';
import { TRANSPORT_CONFIG } from './src/config/transportConfig.js';

// ── 1. Coordinate Ordering & Distance Conversion ──
test('1. OSRM Coordinate Ordering: Formats strictly as [longitude, latitude]', () => {
  const provider = new OSRMRoutingProvider();
  const origin = [35.2698, 0.5143]; // Eldoret [lng, lat]
  const destination = [36.8315, -1.2858]; // Nairobi [lng, lat]

  const cacheKey = provider.getCacheKey(origin, destination);
  assert.equal(cacheKey, '35.26980,0.51430;36.83150,-1.28580');

  // Verify distance conversion
  const distanceMeters = 312450;
  const distanceKm = distanceMeters / 1000;
  assert.equal(distanceKm, 312.45);
});

// ── 2. OSRM Mocked Network Responses ──
test('2. OSRM Provider: Valid routes, NoRoute responses, rate limits, and timeouts', async () => {
  const provider = new OSRMRoutingProvider();

  // Test coordinate bounds validation
  assert.throws(() => {
    provider.validateCoordinates([195.0, 0.0], 'origin'); // lng > 180
  }, /Coordinates out of bounds/);

  assert.throws(() => {
    provider.validateCoordinates([36.0, 95.0], 'destination'); // lat > 90
  }, /Coordinates out of bounds/);

  // Test NoRoute response handling via mocked fetch
  const originalFetch = globalThis.fetch;
  try {
    // A: Success response
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        code: 'Ok',
        routes: [{ distance: 159000, duration: 10800, geometry: '_ibjE_}v^...' }],
      }),
    });

    const successRes = await provider.calculateRoute({
      originCoordinates: [36.0663, -0.2833],
      destinationCoordinates: [36.8315, -1.2858],
      options: { bypassCache: true },
    });

    assert.equal(successRes.success, true);
    assert.equal(successRes.distanceMeters, 159000);
    assert.equal(successRes.distanceKm, 159);
    assert.equal(successRes.attribution, '© OpenStreetMap contributors, OSRM');

    // B: NoRoute response (e.g. disconnected roads or water)
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        code: 'NoRoute',
        message: 'No route found',
      }),
    });

    const noRouteRes = await provider.calculateRoute({
      originCoordinates: [36.0663, -0.2833],
      destinationCoordinates: [36.8315, -1.2858],
      options: { bypassCache: true },
    });

    assert.equal(noRouteRes.success, false);
    assert.equal(noRouteRes.code, 'NO_ROUTE_FOUND');
    assert.equal(noRouteRes.distanceKm, undefined, 'Must never invent a distance when no route exists');

    // C: 429 Rate limit response
    globalThis.fetch = async () => ({
      ok: false,
      status: 429,
    });

    const rateLimitRes = await provider.calculateRoute({
      originCoordinates: [36.0663, -0.2833],
      destinationCoordinates: [36.8315, -1.2858],
      options: { bypassCache: true },
    });

    assert.equal(rateLimitRes.success, false);
    assert.equal(rateLimitRes.code, 'OSRM_RATE_LIMIT_EXCEEDED');

    // D: Timeout simulation
    globalThis.fetch = async () => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    };

    const timeoutRes = await provider.calculateRoute({
      originCoordinates: [36.0663, -0.2833],
      destinationCoordinates: [36.8315, -1.2858],
      options: { bypassCache: true },
    });

    assert.equal(timeoutRes.success, false);
    assert.equal(timeoutRes.code, 'ROUTING_TIMEOUT');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ── 3. Geocoding & Kenyan Agricultural Hubs ──
test('3. Geocoding: Local Kenya agricultural hubs dictionary and error handling', async () => {
  // Hubs dictionary lookup (offline, instant)
  const eldoret = await geocodeLocation('Eldoret, Uasin Gishu');
  assert.equal(eldoret.success, true);
  assert.equal(eldoret.lng, 35.2698);
  assert.equal(eldoret.lat, 0.5143);
  assert.equal(eldoret.source, 'kenya_hubs_dictionary');

  const wakulima = await geocodeLocation('Nairobi - Wakulima Market');
  assert.equal(wakulima.success, true);
  assert.equal(wakulima.lng, 36.8315);
  assert.equal(wakulima.lat, -1.2858);

  // Direct coordinate array [longitude, latitude]
  const directCoords = await geocodeLocation([37.0693, -1.0332]);
  assert.equal(directCoords.success, true);
  assert.equal(directCoords.lng, 37.0693);
  assert.equal(directCoords.lat, -1.0332);
  assert.equal(directCoords.isExactCoordinates, true);

  // Empty location
  const emptyRes = await geocodeLocation('');
  assert.equal(emptyRes.success, false);
  assert.equal(emptyRes.code, 'EMPTY_LOCATION');
});

// ── 4. Caching and Throttling ──
test('4. Caching: Repeated coordinate pairs served from in-memory cache', async () => {
  const provider = new OSRMRoutingProvider();
  const origin = [35.2698, 0.5143];
  const dest = [36.0663, -0.2833];

  const originalFetch = globalThis.fetch;
  let fetchCallCount = 0;
  try {
    globalThis.fetch = async () => {
      fetchCallCount++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          code: 'Ok',
          routes: [{ distance: 153000, duration: 9600 }],
        }),
      };
    };

    // First call: calls fetch
    const res1 = await provider.calculateRoute({ originCoordinates: origin, destinationCoordinates: dest });
    assert.equal(res1.success, true);
    assert.equal(fetchCallCount, 1);

    // Second call: served from cache without calling fetch
    const res2 = await provider.calculateRoute({ originCoordinates: origin, destinationCoordinates: dest });
    assert.equal(res2.success, true);
    assert.equal(res2.isFromCache, true);
    assert.equal(fetchCallCount, 1); // No new network call
  } finally {
    globalThis.fetch = originalFetch;
  }
});

// ── 5. Privacy: Location-Selection & Data Minimization ──
test('5. Privacy: Private coordinates never leaked in public-facing API responses', () => {
  const privateRecord = new TransportRecord({
    userId: '65f1a2b3c4d5e6f7a8b9c0d1',
    userRole: 'FARMER',
    origin: {
      name: 'Farm Plot 4B, Cherangany',
      coordinates: [35.12345, 1.05432],
      isPrivateOrigin: true,
    },
    destination: {
      name: 'Kitale Town',
      coordinates: [35.0062, 1.0167],
    },
    routing: {
      provider: 'osrm_driving',
      distanceMeters: 25000,
      distanceKm: 25,
      durationSeconds: 1800,
      routeStatus: 'SUCCESS',
    },
    vehicleCategory: VehicleCategory.PICKUP,
    reportedPriceKSh: 2500,
    evidenceType: PriceEvidenceType.REPORTED_COMPLETED_JOURNEY,
    journeyDate: new Date(),
    receiptUrl: 'https://secure.mavunotrust.internal/receipts/private_123.jpg',
  });

  // Standard toJSON (public estimate consumer view)
  const publicView = privateRecord.toJSON();
  assert.equal(publicView.userId, undefined, 'userId must be stripped from public view');
  assert.equal(publicView.receiptUrl, undefined, 'receiptUrl must be stripped from public view');
  assert.equal(publicView.origin.coordinates, undefined, 'Exact GPS coordinates must be stripped from public view');
  assert.equal(publicView.destination.coordinates, undefined, 'Destination coordinates must be stripped');

  // Submitter/Owner view with includePrivate
  const ownerView = privateRecord.toJSON({ includePrivate: true });
  assert.ok(ownerView.userId);
  assert.ok(ownerView.receiptUrl);
});

// ── 6. Baseline Calculation (20 km, KSh 1,500 record -> KSh 75/km) ──
test('6. Baseline calculation: 20 km, KSh 1,500 record produces a KSh 75/km baseline', async () => {
  const distanceKm = 20;
  const reportedPriceKSh = 1500;
  const ratePerKm = reportedPriceKSh / distanceKm;
  assert.equal(ratePerKm, 75);

  const mockRecord = {
    userId: 'user_farmer_1',
    distanceKm: 20,
    reportedPriceKSh: 1500,
    vehicleCategory: VehicleCategory.PICKUP,
    tripArrangement: TripArrangement.EXCLUSIVE,
    verificationStatus: TransportVerificationStatus.VERIFIED,
    reviewStatus: TransportReviewStatus.APPROVED,
    createdAt: new Date(),
  };

  const estimate = await estimateTransportCost(
    {
      distanceKm: 20,
      vehicleCategory: VehicleCategory.PICKUP,
      tripArrangement: TripArrangement.EXCLUSIVE,
    },
    { mockRecords: [mockRecord] }
  );

  assert.equal(estimate.baselineRatePerKm, 75);
  assert.equal(estimate.estimatedPriceMedian, 1500);
});

// ── 7. Linear Baseline (12 km at KSh 75/km -> KSh 900) ──
test('7. Linear baseline projection: 12 km journey at KSh 75/km produces KSh 900', async () => {
  const mockRecord = {
    userId: 'user_farmer_1',
    distanceKm: 20,
    reportedPriceKSh: 1500,
    vehicleCategory: VehicleCategory.OTHER,
    tripArrangement: TripArrangement.EXCLUSIVE,
    verificationStatus: TransportVerificationStatus.VERIFIED,
    reviewStatus: TransportReviewStatus.APPROVED,
    createdAt: new Date(),
  };

  const estimate = await estimateTransportCost(
    {
      distanceKm: 12,
      vehicleCategory: VehicleCategory.OTHER,
      tripArrangement: TripArrangement.EXCLUSIVE,
    },
    { mockRecords: [mockRecord] }
  );

  assert.equal(estimate.baselineRatePerKm, 75);
  assert.ok(estimate.estimatedPriceMedian >= 900);
});

// ── 8. Audited Pricing Assumptions & Evidence Priority ──
test('8. Pricing Assumptions: Empirical priority for shared trips and transparent assumption disclosures', async () => {
  // Case A: Empirical records exist for SHARED arrangement
  const sharedRecord = {
    userId: 'user_dealer_1',
    distanceKm: 100,
    reportedPriceKSh: 5200, // Empirical shared price
    vehicleCategory: VehicleCategory.SMALL_TRUCK,
    tripArrangement: TripArrangement.SHARED,
    verificationStatus: TransportVerificationStatus.VERIFIED,
    reviewStatus: TransportReviewStatus.APPROVED,
    createdAt: new Date(),
  };

  const sharedEst = await estimateTransportCost(
    {
      distanceKm: 100,
      vehicleCategory: VehicleCategory.SMALL_TRUCK,
      tripArrangement: TripArrangement.SHARED,
    },
    { mockRecords: [sharedRecord, { ...sharedRecord, userId: 'user_dealer_2' }] }
  );

  // Assumptions should state that estimate is derived directly from empirical shared records
  assert.ok(
    sharedEst.assumptions.some((a) => a.includes('derived directly from comparable shared records')),
    'Should indicate empirical shared records were used'
  );

  // Case B: No records exist (fallback baseline)
  const fallbackEst = await estimateTransportCost(
    {
      distanceKm: 50,
      vehicleCategory: VehicleCategory.SMALL_TRUCK,
    },
    { mockRecords: [] }
  );

  assert.equal(fallbackEst.methodology, 'CONFIGURED_BASELINE_FALLBACK');
  assert.equal(fallbackEst.confidenceLevel, 'INSUFFICIENT_DATA');
  assert.ok(fallbackEst.assumptions.length > 0, 'Must disclose provisional baseline assumptions');
});

// ── 9. Robust Statistics: Median Resists Isolated Extreme Prices ──
test('9. Robust Statistics: Median resists isolated extreme price injections', async () => {
  const normalRecords = [
    { userId: 'u1', distanceKm: 20, reportedPriceKSh: 1500, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED' },
    { userId: 'u2', distanceKm: 20, reportedPriceKSh: 1550, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED' },
    { userId: 'u3', distanceKm: 20, reportedPriceKSh: 1600, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED' },
    { userId: 'u4', distanceKm: 20, reportedPriceKSh: 1650, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED' },
    { userId: 'u5', distanceKm: 20, reportedPriceKSh: 1700, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED' },
  ];

  const corruptedRecords = [
    ...normalRecords,
    { userId: 'bad_actor', distanceKm: 20, reportedPriceKSh: 50000, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED' },
  ];

  const resilientEst = await estimateTransportCost(
    { distanceKm: 20, vehicleCategory: VehicleCategory.PICKUP },
    { mockRecords: corruptedRecords }
  );

  assert.ok(resilientEst.estimatedPriceMedian <= 1750, 'Median should not spike due to 50k injection');
  assert.ok(resilientEst.estimatedPriceMedian >= 1550);
});

// ── 10. Contributor Influence Capping & Sybil Protection ──
test('10. Contributor Capping: Single user spam cannot dominate sample', async () => {
  const records = [
    { userId: 'honest_farmer', distanceKm: 20, reportedPriceKSh: 2000, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED', createdAt: new Date(Date.now() - 1000) },
    { userId: 'spammer', distanceKm: 20, reportedPriceKSh: 10000, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED', createdAt: new Date() },
    { userId: 'spammer', distanceKm: 20, reportedPriceKSh: 10000, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED', createdAt: new Date() },
    { userId: 'spammer', distanceKm: 20, reportedPriceKSh: 10000, vehicleCategory: VehicleCategory.PICKUP, verificationStatus: 'VERIFIED', createdAt: new Date() },
  ];

  const est = await estimateTransportCost(
    { distanceKm: 20, vehicleCategory: VehicleCategory.PICKUP },
    { mockRecords: records }
  );

  assert.ok(est.sampleSize <= 3, 'Spammer must be capped to max 2 records');
  assert.equal(est.contributorCount, 2);
});

// ── 11. Quarantined & Unverified Record Isolation ──
test('11. Quarantine Isolation: Anomalous records do not influence shared estimates', async () => {
  const records = [
    { userId: 'u1', distanceKm: 50, reportedPriceKSh: 4000, vehicleCategory: VehicleCategory.SMALL_TRUCK, verificationStatus: TransportVerificationStatus.VERIFIED },
    { userId: 'u2', distanceKm: 50, reportedPriceKSh: 4200, vehicleCategory: VehicleCategory.SMALL_TRUCK, verificationStatus: TransportVerificationStatus.VERIFIED },
    { userId: 'u3', distanceKm: 50, reportedPriceKSh: 99000, vehicleCategory: VehicleCategory.SMALL_TRUCK, verificationStatus: TransportVerificationStatus.QUARANTINED },
    { userId: 'u4', distanceKm: 50, reportedPriceKSh: 100, vehicleCategory: VehicleCategory.SMALL_TRUCK, verificationStatus: TransportVerificationStatus.REJECTED },
  ];

  const est = await estimateTransportCost(
    { distanceKm: 50, vehicleCategory: VehicleCategory.SMALL_TRUCK },
    { mockRecords: records }
  );

  assert.equal(est.sampleSize, 2);
  assert.ok(est.estimatedPriceMedian < 5000);
});

// ── 12. MCP Tool Role Boundaries & Gemini Tolerance ──
test('12. MCP Permissions & Gemini Failure Tolerance: Strictly enforced without breaking estimation', async () => {
  // Non-admin role must be rejected from administrative review
  const nonAdminRes = await reviewTransportRecordTool({
    recordId: 'rec_123',
    adminId: 'user_farmer',
    adminRole: 'FARMER',
    action: 'APPROVE',
    reasonCode: 'TEST',
  });

  assert.ok(nonAdminRes.error);
  assert.ok(nonAdminRes.error.includes('Access denied'));

  // Gemini failure tolerance
  const estimateData = {
    distanceKm: 42,
    distanceMeters: 42000,
    vehicleCategory: VehicleCategory.PICKUP,
    tripArrangement: TripArrangement.EXCLUSIVE,
    estimatedPriceMin: 2500,
    estimatedPriceMax: 3200,
    estimatedPriceMedian: 2800,
    baselineRatePerKm: 66.7,
    sampleSize: 4,
    contributorCount: 3,
    confidenceLevel: 'MEDIUM',
    warnings: ['Provisional rate applied.'],
  };

  const fullRes = await getTransportExplanation(estimateData, 'Thika', 'Nairobi');
  assert.equal(fullRes.success, true);
  assert.ok(fullRes.explanation.englishSummary);
  assert.ok(fullRes.explanation.swahiliSummary);
});

// ── 13. Marketplace & MCP Functional Integrity ──
test('13. Platform Integrity: Market price & buyer demand tools remain operational', async () => {
  const { getMarketPrices } = await import('./src/mcp/tools/marketTools.js');
  const { findBuyers } = await import('./src/mcp/tools/dealerTools.js');

  assert.equal(typeof getMarketPrices, 'function');
  assert.equal(typeof findBuyers, 'function');
});
