/**
 * Transport-Cost Estimation Service
 *
 * Implements deterministic, robust statistical estimation of transit charges
 * based on eligible crowdsourced and verified transport records.
 *
 * DESIGN PRINCIPLES:
 * 1. Independent of Gemini: Arithmetic and statistical calculations are 100% deterministic.
 * 2. Robust statistics: Uses medians ($Q_2$), IQR spreads, and contributor influence caps
 *    to prevent outliers or malicious reports from warping estimates.
 * 3. Configurable provisional baselines: Minimum call-out fares and default rates are configurable
 *    and clearly labeled as provisional baselines rather than verified empirical constants.
 * 4. Transparent breakdown: Always returns sample sizes, date ranges, explicit assumptions,
 *    confidence indicators, and clear guidance.
 */

import mongoose from 'mongoose';
import TransportRecord, {
  TransportVerificationStatus,
  TransportReviewStatus,
  VehicleCategory,
  TripArrangement,
} from '../models/TransportRecord.js';
import { calculateQuartiles } from './transportDataQualityService.js';
import { TRANSPORT_CONFIG } from '../config/transportConfig.js';

// Configurable provisional base charges (KSh) by vehicle class for short trips (< 25km)
export const VEHICLE_BASE_CHARGES = TRANSPORT_CONFIG.provisionalBaselines.vehicleBaseCharges;

// Configurable provisional vehicle baseline rates per km (fallback when zero corridor records exist)
export const VEHICLE_DEFAULT_RATES_PER_KM = TRANSPORT_CONFIG.provisionalBaselines.defaultRatesPerKm;

/**
 * Calculates a statistical transport cost estimate for a specified route and load profile.
 *
 * @param {Object} query
 * @param {number} query.distanceKm
 * @param {number} [query.distanceMeters]
 * @param {string} [query.originName]
 * @param {string} [query.destinationName]
 * @param {string} [query.vehicleCategory]
 * @param {number} [query.loadWeightKg]
 * @param {string} [query.tripArrangement]
 * @param {Object} [overrides] - Test injection options
 * @returns {Promise<Object>}
 */
export const estimateTransportCost = async (query, overrides = {}) => {
  const distanceKm = Number(query.distanceKm);
  const distanceMeters = query.distanceMeters || Math.round(distanceKm * 1000);
  const vehicleCategory = query.vehicleCategory || VehicleCategory.PICKUP;
  const tripArrangement = query.tripArrangement || TripArrangement.EXCLUSIVE;
  const loadWeightKg = query.loadWeightKg ? Number(query.loadWeightKg) : null;
  const originName = (query.originName || '').trim();
  const destinationName = (query.destinationName || '').trim();

  if (isNaN(distanceKm) || distanceKm <= 0) {
    throw new Error('Distance in kilometres must be a positive number.');
  }

  // 1. Query eligible records from database or test overrides
  let records = [];
  const mockRecs = overrides.mockRecords || query.overrides?.mockRecords;
  if (mockRecs) {
    records = mockRecs;
  } else if (mongoose.connection?.readyState === 1) {
    const filter = {
      verificationStatus: {
        $in: [TransportVerificationStatus.VERIFIED, TransportVerificationStatus.UNVERIFIED],
      },
      reviewStatus: { $ne: TransportReviewStatus.REJECTED },
    };

    // If matching route corridor exists, prioritize it
    if (originName && destinationName) {
      filter.$or = [
        { 'origin.name': new RegExp(`^${originName}$`, 'i'), 'destination.name': new RegExp(`^${destinationName}$`, 'i') },
        { 'origin.name': new RegExp(`^${destinationName}$`, 'i'), 'destination.name': new RegExp(`^${originName}$`, 'i') },
      ];
    }

    records = await TransportRecord.find(filter)
      .select('userId routing reportedPriceKSh vehicleCategory tripArrangement loadWeightKg createdAt journeyDate verificationStatus reviewStatus')
      .lean();
  } else {
    records = [];
  }

  // Exclude any quarantined or rejected records (strict data protection)
  const eligibleRecords = records.filter(
    (r) =>
      r.verificationStatus !== TransportVerificationStatus.QUARANTINED &&
      r.verificationStatus !== TransportVerificationStatus.REJECTED &&
      r.reviewStatus !== TransportReviewStatus.REJECTED &&
      (r.routing?.distanceKm > 0 || r.distanceKm > 0) &&
      r.reportedPriceKSh > 0
  );

  // 2. Contributor influence cap & grouping
  // Group records by submitter (userId). Cap each user to max configured records (default 2)
  // to prevent an individual account or coordinated group from dominating the sample.
  const userRecordMap = new Map();
  eligibleRecords.forEach((rec) => {
    const uid = String(rec.userId || 'anonymous');
    if (!userRecordMap.has(uid)) userRecordMap.set(uid, []);
    userRecordMap.get(uid).push(rec);
  });

  const cappedRecords = [];
  userRecordMap.forEach((userRecs) => {
    const sorted = userRecs.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    cappedRecords.push(...sorted.slice(0, TRANSPORT_CONFIG.quality.maxRecordsPerContributor));
  });

  // 3. Match preference scoring:
  // Track whether empirical records exist for the exact trip arrangement (shared vs exclusive)
  const exactArrangementRecords = cappedRecords.filter((r) => r.tripArrangement === tripArrangement);
  const hasEmpiricalArrangementRecords = exactArrangementRecords.length >= 2;

  // Filter comparable by vehicle, arrangement (if present), and distance bracket (±45%)
  const filteredComparable = cappedRecords.filter((r) => {
    const rDist = r.routing?.distanceKm || r.distanceKm;
    const sameVehicle = !vehicleCategory || r.vehicleCategory === vehicleCategory;
    const sameArrangement = !tripArrangement || r.tripArrangement === tripArrangement;
    const distComparable = Math.abs(rDist - distanceKm) <= Math.max(25, distanceKm * 0.45);
    return sameVehicle && (hasEmpiricalArrangementRecords ? sameArrangement : true) && distComparable;
  });

  // Secondary fallback: Same vehicle category across wider distance range
  const secondaryComparable = cappedRecords.filter((r) => {
    return !vehicleCategory || r.vehicleCategory === vehicleCategory;
  });

  const effectiveSet =
    filteredComparable.length >= 3
      ? filteredComparable
      : secondaryComparable.length >= 2
      ? secondaryComparable
      : cappedRecords;

  const sampleSize = effectiveSet.length;
  const contributorCount = new Set(effectiveSet.map((r) => String(r.userId || 'anon'))).size;

  let calculatedRateMedian = 0;
  let calculatedRateMin = 0;
  let calculatedRateMax = 0;
  let method = 'STATISTICAL_MEDIAN';
  let confidenceLevel = 'LOW';
  const warnings = [];
  const assumptions = [];

  const earliestDate = effectiveSet.length > 0
    ? new Date(Math.min(...effectiveSet.map((r) => new Date(r.journeyDate || r.createdAt || Date.now()))))
    : null;
  const latestDate = effectiveSet.length > 0
    ? new Date(Math.max(...effectiveSet.map((r) => new Date(r.journeyDate || r.createdAt || Date.now()))))
    : null;

  if (sampleSize >= 3) {
    const rates = effectiveSet.map((r) => {
      const d = r.routing?.distanceKm || r.distanceKm;
      return r.reportedPriceKSh / d;
    });

    const { q1, median, q3 } = calculateQuartiles(rates);
    calculatedRateMedian = median;
    calculatedRateMin = Math.max(MIN_PLAUSIBLE_RATE(vehicleCategory), q1);
    calculatedRateMax = q3;

    if (sampleSize >= 8 && contributorCount >= 4) {
      confidenceLevel = 'HIGH';
    } else {
      confidenceLevel = 'MEDIUM';
    }
  } else if (sampleSize === 1 || sampleSize === 2) {
    const rates = effectiveSet.map((r) => {
      const d = r.routing?.distanceKm || r.distanceKm;
      return r.reportedPriceKSh / d;
    });
    calculatedRateMedian = rates.reduce((a, b) => a + b, 0) / rates.length;
    calculatedRateMin = calculatedRateMedian * 0.9;
    calculatedRateMax = calculatedRateMedian * 1.1;
    confidenceLevel = 'LOW';
    warnings.push(`Sparse historical evidence: Only ${sampleSize} supporting record(s) available.`);
  } else {
    // Zero records: use transparent configurable baseline default for Kenya
    calculatedRateMedian = VEHICLE_DEFAULT_RATES_PER_KM[vehicleCategory] || 75;
    calculatedRateMin = calculatedRateMedian * 0.85;
    calculatedRateMax = calculatedRateMedian * 1.25;
    method = 'CONFIGURED_BASELINE_FALLBACK';
    confidenceLevel = 'INSUFFICIENT_DATA';
    warnings.push('No comparable transport records exist for this corridor yet. Using configured regional baseline.');
    assumptions.push(`Provisional baseline rate applied: ~KSh ${calculatedRateMedian}/km for ${vehicleCategory}.`);
  }

  // Linear component
  let estimatedMedian = distanceKm * calculatedRateMedian;
  let estimatedMin = distanceKm * calculatedRateMin;
  let estimatedMax = distanceKm * calculatedRateMax;

  // Base charge floor for short trips (non-linear baseline assumption)
  const baseCharge = VEHICLE_BASE_CHARGES[vehicleCategory] || 1500;
  if (estimatedMedian < baseCharge) {
    estimatedMedian = baseCharge;
    estimatedMin = Math.round(baseCharge * 0.9);
    estimatedMax = Math.round(baseCharge * 1.2);
    assumptions.push(`Provisional minimum call-out charge of KSh ${baseCharge.toLocaleString()} applied for short distance (< 25 km).`);
  }

  // Shared load adjustment:
  // ONLY apply provisional multiplier if empirical sample did NOT already contain shared records
  if (tripArrangement === TripArrangement.SHARED) {
    if (!hasEmpiricalArrangementRecords) {
      const factor = TRANSPORT_CONFIG.provisionalBaselines.sharedLoadProvisionalFactor;
      estimatedMedian = Math.round(estimatedMedian * factor);
      estimatedMin = Math.round(estimatedMin * (factor - 0.05));
      estimatedMax = Math.round(estimatedMax * (factor + 0.05));
      assumptions.push('Provisional shared-load baseline factor (0.65) applied in absence of comparable shared records.');
    } else {
      assumptions.push('Shared-load estimate derived directly from comparable shared records.');
    }
  }

  // Heavy load adjustment:
  // ONLY apply provisional surcharge if load exceeds 3,000 kg and vehicle is large enough
  if (loadWeightKg && loadWeightKg > 3000 && vehicleCategory !== VehicleCategory.PICKUP) {
    const factor = TRANSPORT_CONFIG.provisionalBaselines.heavyLoadProvisionalFactor;
    estimatedMedian = Math.round(estimatedMedian * factor);
    estimatedMin = Math.round(estimatedMin * (factor - 0.05));
    estimatedMax = Math.round(estimatedMax * (factor + 0.05));
    assumptions.push(`Provisional heavy-load fuel adjustment (+10%) applied for cargo exceeding 3,000 kg (${loadWeightKg} kg requested).`);
  }

  // Round values to sensible nearest 50 KSh for display
  const roundKSh = (num) => Math.round(num / 50) * 50;

  warnings.push('Transport rates fluctuate based on road conditions, weather, fuel prices, and return-load availability. Always negotiate directly with transporters.');

  return {
    success: true,
    currency: 'KSh',
    distanceKm: Math.round(distanceKm * 10) / 10,
    distanceMeters,
    vehicleCategory,
    tripArrangement,
    assumedLoadKg: loadWeightKg,
    estimatedPriceMin: roundKSh(estimatedMin),
    estimatedPriceMax: roundKSh(estimatedMax),
    estimatedPriceMedian: roundKSh(estimatedMedian),
    baselineRatePerKm: Math.round(calculatedRateMedian * 10) / 10,
    sampleSize,
    contributorCount,
    dateRange: {
      earliest: earliestDate,
      latest: latestDate,
    },
    methodology: method,
    confidenceLevel,
    assumptions,
    warnings,
    recommendations: 'Obtain at least two competitive quotations from local transporters before committing cargo.',
  };
};

function MIN_PLAUSIBLE_RATE(vehicleCategory) {
  return (VEHICLE_DEFAULT_RATES_PER_KM[vehicleCategory] || 60) * 0.4;
}
