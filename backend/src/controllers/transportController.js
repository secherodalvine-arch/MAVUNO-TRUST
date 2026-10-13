/**
 * Transport Controller
 *
 * Handles API endpoints for road routing, transport record submissions,
 * statistical cost estimates, and admin quality review workflows.
 */

import TransportRecord, {
  TransportVerificationStatus,
  TransportReviewStatus,
} from '../models/TransportRecord.js';
import { computeRoadRoute } from '../services/routing/index.js';
import {
  evaluateTransportRecord,
  reviewTransportRecord,
} from '../services/transportDataQualityService.js';
import { estimateTransportCost } from '../services/transportEstimationService.js';
import { getTransportExplanation } from '../agents/intelligenceAgent/transportAdvisor.js';

/**
 * Compute road route distance and duration using OpenStreetMap road network via OSRM.
 * POST /api/transport/route
 */
export const calculateRoute = async (req, res, next) => {
  try {
    const { origin, destination, trafficAware } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: { message: 'Both origin and destination are required.' },
      });
    }

    const routeResult = await computeRoadRoute({
      origin,
      destination,
      options: { trafficAware: Boolean(trafficAware) },
    });

    if (!routeResult.success) {
      return res.status(400).json({
        success: false,
        error: { code: routeResult.code, message: routeResult.message },
      });
    }

    return res.status(200).json({
      success: true,
      data: routeResult,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate a statistical transport-cost estimate for a journey.
 * POST /api/transport/estimate
 */
export const getTransportEstimate = async (req, res, next) => {
  try {
    const {
      origin,
      destination,
      distanceKm: clientDistanceKm,
      vehicleCategory,
      tripArrangement,
      loadWeightKg,
    } = req.body;

    let distanceKm = clientDistanceKm ? Number(clientDistanceKm) : null;
    let distanceMeters = null;
    let routeInfo = null;

    // If coordinates or addresses are provided and distance is not specified, resolve road route
    if ((!distanceKm || distanceKm <= 0) && origin && destination) {
      routeInfo = await computeRoadRoute({ origin, destination });
      if (!routeInfo.success) {
        return res.status(400).json({
          success: false,
          error: {
            code: routeInfo.code,
            message: `Could not calculate route: ${routeInfo.message}`,
          },
        });
      }
      distanceKm = routeInfo.distanceKm;
      distanceMeters = routeInfo.distanceMeters;
    }

    if (!distanceKm || distanceKm <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'A valid positive distanceKm or valid origin/destination is required.' },
      });
    }

    const originName = typeof origin === 'string' ? origin : origin?.name || origin?.address;
    const destName = typeof destination === 'string' ? destination : destination?.name || destination?.address;

    const estimate = await estimateTransportCost({
      distanceKm,
      distanceMeters,
      originName,
      destinationName: destName,
      vehicleCategory,
      tripArrangement,
      loadWeightKg,
    });

    const explanationResult = await getTransportExplanation(estimate, originName, destName);

    return res.status(200).json({
      success: true,
      data: {
        ...estimate,
        routeDetails: routeInfo || { distanceKm, distanceMeters: Math.round(distanceKm * 1000) },
        explanation: explanationResult.explanation,
        advisorSource: explanationResult.source,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit a transport record (Farmer or Dealer).
 * POST /api/transport/records
 */
export const submitTransportRecord = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;

    const {
      origin,
      destination,
      vehicleCategory,
      cropCategory,
      loadWeightKg,
      vehiclePayloadKg,
      tripArrangement,
      reportedPriceKSh,
      evidenceType,
      journeyDate,
      receiptUrl,
      notes,
    } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: { message: 'Origin and destination are required.' },
      });
    }

    if (!reportedPriceKSh || Number(reportedPriceKSh) <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Reported price in KSh must be greater than zero.' },
      });
    }

    if (!vehicleCategory) {
      return res.status(400).json({
        success: false,
        error: { message: 'Vehicle category is required.' },
      });
    }

    // Always compute real road distance from authorized routing service
    // to prevent client-side distance spoofing
    const routeResult = await computeRoadRoute({ origin, destination });

    if (!routeResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: routeResult.code,
          message: `Unable to verify road route: ${routeResult.message}`,
        },
      });
    }

    const originName = typeof origin === 'string' ? origin : origin.name || origin.address;
    const destName = typeof destination === 'string' ? destination : destination.name || destination.address;

    // Run data quality & anti-manipulation evaluation
    const evaluation = await evaluateTransportRecord({
      userId,
      distanceKm: routeResult.distanceKm,
      reportedPriceKSh: Number(reportedPriceKSh),
      vehicleCategory,
      loadWeightKg: loadWeightKg ? Number(loadWeightKg) : undefined,
      originName,
      destinationName: destName,
      evidenceType,
      journeyDate: journeyDate ? new Date(journeyDate) : new Date(),
    });

    const newRecord = new TransportRecord({
      userId,
      userRole,
      origin: {
        name: originName,
        county: origin.county || undefined,
        isPrivateOrigin: Boolean(origin.isPrivateOrigin),
      },
      destination: {
        name: destName,
        county: destination.county || undefined,
      },
      routing: {
        provider: routeResult.provider,
        distanceMeters: routeResult.distanceMeters,
        distanceKm: routeResult.distanceKm,
        durationSeconds: routeResult.durationSeconds || 0,
        routeStatus: 'SUCCESS',
      },
      cropCategory: cropCategory || 'General Produce',
      vehicleCategory,
      loadWeightKg: loadWeightKg ? Number(loadWeightKg) : undefined,
      vehiclePayloadKg: vehiclePayloadKg ? Number(vehiclePayloadKg) : undefined,
      tripArrangement: tripArrangement || 'EXCLUSIVE',
      reportedPriceKSh: Number(reportedPriceKSh),
      evidenceType,
      journeyDate: journeyDate ? new Date(journeyDate) : new Date(),
      receiptUrl: receiptUrl || undefined,
      notes,
      verificationStatus: evaluation.verificationStatus,
      reviewStatus: evaluation.reviewStatus,
      anomalyFlags: evaluation.anomalyFlags,
    });

    await newRecord.save();

    return res.status(201).json({
      success: true,
      message: evaluation.isQuarantined
        ? 'Record submitted. Flagged for administrative verification due to statistical anomaly.'
        : 'Transport record successfully logged.',
      data: newRecord.toJSON({ includePrivate: true }),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve authenticated user's submitted transport records.
 * GET /api/transport/records/my
 */
export const getMyTransportRecords = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const records = await TransportRecord.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: records.map((r) => r.toJSON({ includePrivate: true })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update authenticated user's own transport record.
 * PATCH /api/transport/records/:id
 */
export const updateMyTransportRecord = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { notes, evidenceType, receiptUrl } = req.body;

    const record = await TransportRecord.findOne({ _id: id, userId });
    if (!record) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transport record not found or access denied.' },
      });
    }

    if (notes !== undefined) record.notes = notes;
    if (evidenceType !== undefined) record.evidenceType = evidenceType;
    if (receiptUrl !== undefined) record.receiptUrl = receiptUrl;

    await record.save();

    return res.status(200).json({
      success: true,
      message: 'Transport record updated.',
      data: record.toJSON({ includePrivate: true }),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Submit an appeal for a flagged/quarantined transport record.
 * POST /api/transport/records/:id/appeal
 */
export const appealTransportRecord = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { appealNotes, receiptUrl } = req.body;

    const record = await TransportRecord.findOne({ _id: id, userId });
    if (!record) {
      return res.status(404).json({
        success: false,
        error: { message: 'Transport record not found or access denied.' },
      });
    }

    record.isAppealRequested = true;
    record.appealNotes = appealNotes || 'User requested review of flagged status.';
    record.appealSubmittedAt = new Date();
    if (receiptUrl) record.receiptUrl = receiptUrl;

    record.anomalyFlags.push({
      flag: 'USER_APPEAL_PENDING',
      severity: 'LOW',
      details: appealNotes || 'User submitted clarification.',
      detectedAt: new Date(),
    });

    await record.save();

    return res.status(200).json({
      success: true,
      message: 'Appeal submitted for administrative review.',
      data: record.toJSON({ includePrivate: true }),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve privacy-sanitized comparable historical records.
 * GET /api/transport/comparables
 */
export const getComparableRecords = async (req, res, next) => {
  try {
    const { origin, destination, vehicleCategory, limit = 20 } = req.query;

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
      .sort({ createdAt: -1 })
      .limit(Math.min(50, Number(limit) || 20));

    // toJSON default omits user ID, receipt, and exact coordinates
    return res.status(200).json({
      success: true,
      data: records.map((r) => r.toJSON({ includePrivate: false })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: List flagged / quarantined transport records.
 * GET /api/transport/admin/flagged
 */
export const getAdminFlaggedRecords = async (req, res, next) => {
  try {
    const { status = 'ALL', limit = 50 } = req.query;

    const filter = {};
    if (status === 'QUARANTINED') {
      filter.verificationStatus = TransportVerificationStatus.QUARANTINED;
    } else if (status === 'APPEAL') {
      filter.isAppealRequested = true;
    } else {
      filter.$or = [
        { verificationStatus: TransportVerificationStatus.QUARANTINED },
        { isAppealRequested: true },
        { 'anomalyFlags.0': { $exists: true } },
      ];
    }

    const records = await TransportRecord.find(filter)
      .populate('userId', 'fullName email role createdAt')
      .sort({ updatedAt: -1 })
      .limit(Number(limit) || 50);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Review, approve, quarantine, or reject a transport record.
 * PATCH /api/transport/admin/records/:id/review
 */
export const adminReviewRecord = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { action, reasonCode, notes } = req.body;

    if (!action || !reasonCode) {
      return res.status(400).json({
        success: false,
        error: { message: 'Action and reasonCode are required for moderation review.' },
      });
    }

    const updated = await reviewTransportRecord({
      recordId: id,
      adminId,
      action,
      reasonCode,
      notes,
    });

    return res.status(200).json({
      success: true,
      message: `Record status updated to ${updated.verificationStatus}.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
