/**
 * Transport MCP Tools
 *
 * Tools for road routing, transport records, statistical cost estimation,
 * comparable corridor lookups, and administrative moderation.
 */

import { computeRoadRoute } from '../../services/routing/index.js';
import { estimateTransportCost } from '../../services/transportEstimationService.js';
import {
  evaluateTransportRecord,
  reviewTransportRecord as executeReview,
} from '../../services/transportDataQualityService.js';
import TransportRecord, {
  TransportVerificationStatus,
  TransportReviewStatus,
} from '../../models/TransportRecord.js';

/**
 * Tool: compute_route_distance
 */
export const computeRouteDistanceTool = async ({ origin, destination, trafficAware = false }) => {
  if (!origin || !destination) {
    return { error: 'Both origin and destination are required' };
  }
  return await computeRoadRoute({
    origin,
    destination,
    options: { trafficAware },
  });
};

/**
 * Tool: get_transport_cost_estimate
 */
export const getTransportCostEstimateTool = async ({
  origin,
  destination,
  distanceKm,
  vehicleCategory,
  loadWeightKg,
  tripArrangement,
}) => {
  let resolvedKm = distanceKm ? Number(distanceKm) : null;
  let routeMeta = null;

  if (!resolvedKm && origin && destination) {
    const route = await computeRoadRoute({ origin, destination });
    if (!route.success) {
      return { error: `Routing calculation failed: ${route.message}` };
    }
    resolvedKm = route.distanceKm;
    routeMeta = route;
  }

  if (!resolvedKm || resolvedKm <= 0) {
    return { error: 'Distance in km could not be determined. Provide a positive distanceKm or valid locations.' };
  }

  const estimate = await estimateTransportCost({
    distanceKm: resolvedKm,
    originName: typeof origin === 'string' ? origin : origin?.name,
    destinationName: typeof destination === 'string' ? destination : destination?.name,
    vehicleCategory,
    loadWeightKg,
    tripArrangement,
  });

  return {
    ...estimate,
    route: routeMeta,
  };
};

/**
 * Tool: submit_transport_record
 */
export const submitTransportRecordTool = async ({
  userId,
  userRole,
  origin,
  destination,
  vehicleCategory,
  reportedPriceKSh,
  evidenceType,
  cropCategory,
  loadWeightKg,
  tripArrangement,
  journeyDate,
  notes,
}) => {
  if (!userId || !userRole) {
    return { error: 'Authenticated user context (userId and userRole) is required' };
  }
  if (!origin || !destination || !vehicleCategory || !reportedPriceKSh) {
    return { error: 'Origin, destination, vehicleCategory, and reportedPriceKSh are required' };
  }

  // Derive genuine road distance
  const route = await computeRoadRoute({ origin, destination });
  if (!route.success) {
    return { error: `Route validation failed: ${route.message}` };
  }

  const originName = typeof origin === 'string' ? origin : origin.name || origin.address;
  const destName = typeof destination === 'string' ? destination : destination.name || destination.address;

  // Evaluate data quality
  const evaluation = await evaluateTransportRecord({
    userId,
    distanceKm: route.distanceKm,
    reportedPriceKSh: Number(reportedPriceKSh),
    vehicleCategory,
    loadWeightKg,
    originName,
    destinationName: destName,
    evidenceType,
    journeyDate: journeyDate ? new Date(journeyDate) : new Date(),
  });

  const record = new TransportRecord({
    userId,
    userRole,
    origin: { name: originName },
    destination: { name: destName },
    routing: {
      provider: route.provider,
      distanceMeters: route.distanceMeters,
      distanceKm: route.distanceKm,
      durationSeconds: route.durationSeconds || 0,
      routeStatus: 'SUCCESS',
    },
    cropCategory: cropCategory || 'General Produce',
    vehicleCategory,
    loadWeightKg,
    tripArrangement: tripArrangement || 'EXCLUSIVE',
    reportedPriceKSh: Number(reportedPriceKSh),
    evidenceType,
    journeyDate: journeyDate ? new Date(journeyDate) : new Date(),
    notes,
    verificationStatus: evaluation.verificationStatus,
    reviewStatus: evaluation.reviewStatus,
    anomalyFlags: evaluation.anomalyFlags,
  });

  await record.save();

  return {
    success: true,
    recordId: record._id,
    isQuarantined: evaluation.isQuarantined,
    verificationStatus: evaluation.verificationStatus,
    anomalyFlags: evaluation.anomalyFlags,
    message: evaluation.isQuarantined
      ? 'Record quarantined for moderation review due to statistical anomaly'
      : 'Transport record saved successfully',
  };
};

/**
 * Tool: get_user_transport_records
 */
export const getUserTransportRecordsTool = async ({ userId }) => {
  if (!userId) return { error: 'userId is required' };
  const records = await TransportRecord.find({ userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();
  return records;
};

/**
 * Tool: get_comparable_transport_records
 */
export const getComparableTransportRecordsTool = async ({
  origin,
  destination,
  vehicleCategory,
  limit = 20,
}) => {
  const filter = {
    verificationStatus: {
      $in: [TransportVerificationStatus.VERIFIED, TransportVerificationStatus.UNVERIFIED],
    },
    reviewStatus: { $ne: TransportReviewStatus.REJECTED },
  };

  if (origin) filter['origin.name'] = new RegExp(origin, 'i');
  if (destination) filter['destination.name'] = new RegExp(destination, 'i');
  if (vehicleCategory) filter.vehicleCategory = vehicleCategory;

  const records = await TransportRecord.find(filter)
    .select('origin.name destination.name routing.distanceKm vehicleCategory tripArrangement reportedPriceKSh journeyDate verificationStatus')
    .sort({ createdAt: -1 })
    .limit(Number(limit) || 20)
    .lean();

  return records;
};

/**
 * Tool: review_transport_record
 */
export const reviewTransportRecordTool = async ({
  recordId,
  adminId,
  adminRole,
  action,
  reasonCode,
  notes,
}) => {
  if (adminRole !== 'ADMIN') {
    return { error: 'Access denied. Administrative role (ADMIN) required to moderate transport records.' };
  }
  if (!recordId || !action || !reasonCode) {
    return { error: 'recordId, action, and reasonCode are required.' };
  }

  const updated = await executeReview({
    recordId,
    adminId,
    action,
    reasonCode,
    notes,
  });

  return {
    success: true,
    recordId: updated._id,
    verificationStatus: updated.verificationStatus,
    reviewStatus: updated.reviewStatus,
  };
};
