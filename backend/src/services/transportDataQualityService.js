/**
 * Transport Data-Quality & Anti-Manipulation Pipeline
 *
 * Protects shared transport-cost intelligence from accidental errors, spam,
 * fabricated reports, extreme outliers, and coordinated price manipulation.
 */

import TransportRecord, {
  TransportVerificationStatus,
  TransportReviewStatus,
  VehicleCategory,
  PriceEvidenceType,
} from '../models/TransportRecord.js';
import User from '../models/User.js';
import { TRANSPORT_CONFIG } from '../config/transportConfig.js';

// Configurable plausible rate thresholds (in KSh per km)
export const MIN_PLAUSIBLE_RATE_PER_KM = TRANSPORT_CONFIG.quality.minPlausibleRatePerKm;
export const MAX_PLAUSIBLE_RATE_PER_KM = TRANSPORT_CONFIG.quality.maxPlausibleRatePerKm;

// Vehicle typical payload limits in KG
export const VEHICLE_MAX_PAYLOAD_KG = {
  [VehicleCategory.PICKUP]: 2500, // max ~2.5 tonnes
  [VehicleCategory.SMALL_TRUCK]: 7000, // max ~7 tonnes
  [VehicleCategory.MEDIUM_LORRY]: 15000, // max ~15 tonnes
  [VehicleCategory.LARGE_LORRY]: 40000, // max ~40 tonnes
  [VehicleCategory.OTHER]: 60000,
};

/**
 * Calculates median and Interquartile Range (IQR) for a series of numbers.
 */
export const calculateQuartiles = (values) => {
  if (!values || values.length === 0) return { q1: 0, median: 0, q3: 0, iqr: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const getPercentile = (p) => {
    const idx = (n - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    if (lower === upper) return sorted[lower];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  };

  const q1 = getPercentile(0.25);
  const median = getPercentile(0.5);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  return { q1, median, q3, iqr };
};

/**
 * Evaluates a candidate transport record against quality & anti-manipulation rules.
 *
 * @param {Object} candidate
 * @param {string} candidate.userId
 * @param {number} candidate.distanceKm
 * @param {number} candidate.reportedPriceKSh
 * @param {string} candidate.vehicleCategory
 * @param {number} [candidate.loadWeightKg]
 * @param {string} candidate.originName
 * @param {string} candidate.destinationName
 * @param {string} candidate.evidenceType
 * @param {Date} [candidate.journeyDate]
 * @returns {Promise<{
 *   isApproved: boolean,
 *   isQuarantined: boolean,
 *   verificationStatus: string,
 *   reviewStatus: string,
 *   anomalyFlags: Array<{ flag: string, severity: string, details: string }>
 * }>}
 */
export const evaluateTransportRecord = async (candidate) => {
  const flags = [];
  const distanceKm = Number(candidate.distanceKm);
  const price = Number(candidate.reportedPriceKSh);

  if (distanceKm <= 0) {
    flags.push({
      flag: 'IMPLAUSIBLE_RATE',
      severity: 'CRITICAL',
      details: 'Distance must be strictly positive.',
    });
  }

  if (price <= 0) {
    flags.push({
      flag: 'IMPLAUSIBLE_RATE',
      severity: 'CRITICAL',
      details: 'Reported price must be greater than zero.',
    });
  }

  const ratePerKm = distanceKm > 0 ? price / distanceKm : 0;

  // 1. Plausible rate bounds check
  if (ratePerKm < MIN_PLAUSIBLE_RATE_PER_KM) {
    flags.push({
      flag: 'IMPLAUSIBLE_RATE',
      severity: 'HIGH',
      details: `Rate of KSh ${ratePerKm.toFixed(1)}/km is below minimum threshold (KSh ${MIN_PLAUSIBLE_RATE_PER_KM}/km).`,
    });
  } else if (ratePerKm > MAX_PLAUSIBLE_RATE_PER_KM) {
    flags.push({
      flag: 'IMPLAUSIBLE_RATE',
      severity: 'HIGH',
      details: `Rate of KSh ${ratePerKm.toFixed(1)}/km exceeds maximum plausible commercial threshold (KSh ${MAX_PLAUSIBLE_RATE_PER_KM}/km).`,
    });
  }

  // 2. Vehicle payload sanity check
  if (candidate.loadWeightKg && candidate.vehicleCategory) {
    const maxAllowed = VEHICLE_MAX_PAYLOAD_KG[candidate.vehicleCategory];
    if (maxAllowed && candidate.loadWeightKg > maxAllowed) {
      flags.push({
        flag: 'IMPLAUSIBLE_LOAD',
        severity: 'MEDIUM',
        details: `Reported weight of ${candidate.loadWeightKg} kg exceeds typical ${candidate.vehicleCategory} payload rating of ${maxAllowed} kg.`,
      });
    }
  }

  // 3. Duplicate submission check (same user within past 24 hours on same route)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentDuplicate = await TransportRecord.findOne({
    userId: candidate.userId,
    'origin.name': candidate.originName,
    'destination.name': candidate.destinationName,
    vehicleCategory: candidate.vehicleCategory,
    createdAt: { $gte: oneDayAgo },
  });

  if (recentDuplicate) {
    flags.push({
      flag: 'DUPLICATE_SUBMISSION',
      severity: 'MEDIUM',
      details: 'A transport submission for this corridor was already recorded by this account in the past 24 hours.',
    });
  }

  // 4. Statistical outlier detection against comparable historical records
  const comparableRecords = await TransportRecord.find({
    'origin.name': candidate.originName,
    'destination.name': candidate.destinationName,
    vehicleCategory: candidate.vehicleCategory,
    verificationStatus: { $in: [TransportVerificationStatus.VERIFIED, TransportVerificationStatus.UNVERIFIED] },
    reviewStatus: { $ne: TransportReviewStatus.REJECTED },
  })
    .select('routing.distanceKm reportedPriceKSh')
    .lean();

  if (comparableRecords.length >= 4) {
    const rates = comparableRecords
      .map((r) => r.reportedPriceKSh / r.routing.distanceKm)
      .filter((r) => !isNaN(r) && r > 0);

    const { q1, q3, iqr } = calculateQuartiles(rates);

    if (iqr > 0) {
      const lowerFence = Math.max(0, q1 - 2.5 * iqr);
      const upperFence = q3 + 2.5 * iqr;

      if (ratePerKm < lowerFence || ratePerKm > upperFence) {
        flags.push({
          flag: 'STATISTICAL_OUTLIER',
          severity: 'HIGH',
          details: `Candidate rate KSh ${ratePerKm.toFixed(1)}/km deviates significantly from route quartile bounds (IQR range: KSh ${lowerFence.toFixed(1)} - ${upperFence.toFixed(1)}/km).`,
        });
      }
    }
  }

  // 5. Coordinated Sybil Clustering check
  // Check if multiple accounts created within last 7 days submit identical prices on this corridor within 48h
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const recentCorridorSubmissions = await TransportRecord.find({
    'origin.name': candidate.originName,
    'destination.name': candidate.destinationName,
    reportedPriceKSh: price,
    createdAt: { $gte: twoDaysAgo },
    userId: { $ne: candidate.userId },
  })
    .populate('userId', 'createdAt')
    .lean();

  if (recentCorridorSubmissions.length >= 2) {
    // Check account ages of submitters
    const now = Date.now();
    const newAccountSubmissions = recentCorridorSubmissions.filter((r) => {
      if (!r.userId || !r.userId.createdAt) return false;
      const accountAgeDays = (now - new Date(r.userId.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return accountAgeDays < 7;
    });

    if (newAccountSubmissions.length >= 2) {
      flags.push({
        flag: 'COORDINATED_CLUSTER_SUSPECT',
        severity: 'CRITICAL',
        details: 'Identical pricing detected across multiple newly created accounts within a 48-hour window.',
      });
    }
  }

  // Determine initial status based on flags and evidence
  const hasCritical = flags.some((f) => f.severity === 'CRITICAL');
  const hasHigh = flags.some((f) => f.severity === 'HIGH');

  let verificationStatus = TransportVerificationStatus.UNVERIFIED;
  let reviewStatus = TransportReviewStatus.PENDING;

  if (hasCritical || (hasHigh && flags.length >= 2)) {
    verificationStatus = TransportVerificationStatus.QUARANTINED;
    reviewStatus = TransportReviewStatus.PENDING;
  } else if (candidate.evidenceType === PriceEvidenceType.COMPLETED_JOURNEY_WITH_RECEIPT && !hasHigh) {
    // Has verifiable receipt evidence and no high severity anomaly flags
    verificationStatus = TransportVerificationStatus.VERIFIED;
    reviewStatus = TransportReviewStatus.APPROVED;
  } else {
    // Standard unverified report
    verificationStatus = TransportVerificationStatus.UNVERIFIED;
    reviewStatus = TransportReviewStatus.PENDING;
  }

  return {
    isApproved: reviewStatus === TransportReviewStatus.APPROVED,
    isQuarantined: verificationStatus === TransportVerificationStatus.QUARANTINED,
    verificationStatus,
    reviewStatus,
    anomalyFlags: flags,
  };
};

/**
 * Applies admin review action to a transport record and updates audit trail.
 */
export const reviewTransportRecord = async ({ recordId, adminId, action, reasonCode, notes }) => {
  const record = await TransportRecord.findById(recordId);
  if (!record) {
    throw new Error('Transport record not found');
  }

  let newVerificationStatus = record.verificationStatus;
  let newReviewStatus = record.reviewStatus;

  switch (action) {
    case 'APPROVE':
    case 'RESTORE_APPEAL':
      newVerificationStatus = TransportVerificationStatus.VERIFIED;
      newReviewStatus = TransportReviewStatus.APPROVED;
      record.isAppealRequested = false;
      break;
    case 'QUARANTINE':
      newVerificationStatus = TransportVerificationStatus.QUARANTINED;
      newReviewStatus = TransportReviewStatus.PENDING;
      break;
    case 'REJECT':
      newVerificationStatus = TransportVerificationStatus.REJECTED;
      newReviewStatus = TransportReviewStatus.REJECTED;
      record.isAppealRequested = false;
      break;
    case 'REQUEST_INFO':
      newReviewStatus = TransportReviewStatus.NEEDS_MORE_INFO;
      break;
    default:
      throw new Error(`Invalid moderation action: ${action}`);
  }

  record.verificationStatus = newVerificationStatus;
  record.reviewStatus = newReviewStatus;

  record.moderationHistory.push({
    reviewedBy: adminId,
    action,
    reasonCode,
    notes: notes || '',
    timestamp: new Date(),
  });

  await record.save();
  return record;
};
