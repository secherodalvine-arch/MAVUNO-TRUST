/**
 * TransportRecord Model
 *
 * Stores crowdsourced and verified transport pricing records contributed by
 * Farmers and Dealers across Kenyan transit corridors.
 *
 * PRIVACY & SECURITY:
 * 1. Personal submitter details, contact information, private farm GPS, and
 *    uploaded receipt URLs are restricted from public estimate consumers.
 * 2. Origin/Destination are captured with protected coordinates.
 * 3. Monetary units are strictly Total Journey Price in KSh.
 *    Per-km and per-kg metrics are derived dynamically.
 * 4. Verification and moderation statuses are immutable by non-admin clients.
 */

import mongoose, { Schema } from 'mongoose';
import { UserRole } from './User.js';

export const VehicleCategory = {
  PICKUP: 'PICKUP', // e.g. Toyota Hilux, Isuzu D-Max (~1 - 1.5 tonne)
  SMALL_TRUCK: 'SMALL_TRUCK', // e.g. Isuzu FRR, Canter (~3 - 5 tonnes)
  MEDIUM_LORRY: 'MEDIUM_LORRY', // e.g. Mitsubishi Fuso, Isuzu FVR (~7 - 10 tonnes)
  LARGE_LORRY: 'LARGE_LORRY', // e.g. Semi-trailer, 15+ tonnes
  OTHER: 'OTHER',
};

export const TripArrangement = {
  EXCLUSIVE: 'EXCLUSIVE', // Full vehicle chartered exclusively
  SHARED: 'SHARED', // Part-load / group shared transport
};

export const PriceEvidenceType = {
  USER_ESTIMATE: 'USER_ESTIMATE',
  TRANSPORTER_QUOTATION: 'TRANSPORTER_QUOTATION',
  REPORTED_COMPLETED_JOURNEY: 'REPORTED_COMPLETED_JOURNEY',
  COMPLETED_JOURNEY_WITH_RECEIPT: 'COMPLETED_JOURNEY_WITH_RECEIPT',
};

export const TransportVerificationStatus = {
  VERIFIED: 'VERIFIED',
  UNVERIFIED: 'UNVERIFIED',
  QUARANTINED: 'QUARANTINED',
  REJECTED: 'REJECTED',
};

export const TransportReviewStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  NEEDS_MORE_INFO: 'NEEDS_MORE_INFO',
};

const AnomalyFlagSchema = new Schema(
  {
    flag: {
      type: String,
      required: true,
      enum: [
        'STATISTICAL_OUTLIER',
        'IMPLAUSIBLE_RATE',
        'IMPLAUSIBLE_LOAD',
        'DUPLICATE_SUBMISSION',
        'COORDINATED_CLUSTER_SUSPECT',
        'EXTREME_PRICE_SPIKE',
        'USER_APPEAL_PENDING',
      ],
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
    },
    details: { type: String, trim: true },
    detectedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ModerationHistorySchema = new Schema(
  {
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['APPROVE', 'QUARANTINE', 'REJECT', 'REQUEST_INFO', 'RESTORE_APPEAL'],
      required: true,
    },
    reasonCode: { type: String, required: true },
    notes: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TransportRecordSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Submitter user reference is required'],
    },
    userRole: {
      type: String,
      enum: [UserRole.FARMER, UserRole.DEALER],
      required: [true, 'Submitter role must be FARMER or DEALER'],
    },
    origin: {
      name: { type: String, required: [true, 'Origin name/town is required'], trim: true },
      county: { type: String, trim: true },
      isPrivateOrigin: { type: Boolean, default: false },
      // Optional coarse coordinate [longitude, latitude] for routing calculation only
      coordinates: {
        type: [Number],
        validate: {
          validator: (val) => !val || (Array.isArray(val) && val.length === 2),
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    destination: {
      name: { type: String, required: [true, 'Destination name/town is required'], trim: true },
      county: { type: String, trim: true },
      coordinates: {
        type: [Number],
        validate: {
          validator: (val) => !val || (Array.isArray(val) && val.length === 2),
          message: 'Coordinates must be [longitude, latitude]',
        },
      },
    },
    routing: {
      provider: { type: String, default: 'osrm_driving' },
      distanceMeters: {
        type: Number,
        required: [true, 'Distance in metres is required'],
        min: [100, 'Distance must be at least 100 metres'],
      },
      distanceKm: {
        type: Number,
        required: [true, 'Distance in kilometres is required'],
        min: [0.1, 'Distance must be at least 0.1 km'],
      },
      durationSeconds: { type: Number, default: 0 },
      retrievalTimestamp: { type: Date, default: Date.now },
      routeStatus: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
    },
    cropCategory: {
      type: String,
      trim: true,
      default: 'General Agricultural Produce',
    },
    vehicleCategory: {
      type: String,
      enum: Object.values(VehicleCategory),
      required: [true, 'Vehicle category is required'],
    },
    loadWeightKg: {
      type: Number,
      min: [0, 'Load weight cannot be negative'],
    },
    vehiclePayloadKg: {
      type: Number,
      min: [0, 'Vehicle payload cannot be negative'],
    },
    tripArrangement: {
      type: String,
      enum: Object.values(TripArrangement),
      default: TripArrangement.EXCLUSIVE,
      required: [true, 'Trip arrangement is required (EXCLUSIVE or SHARED)'],
    },
    reportedPriceKSh: {
      type: Number,
      required: [true, 'Reported total price in KSh is required'],
      min: [1, 'Price must be greater than zero'],
    },
    evidenceType: {
      type: String,
      enum: Object.values(PriceEvidenceType),
      required: [true, 'Evidence type is required'],
    },
    journeyDate: {
      type: Date,
      required: [true, 'Journey date is required'],
    },
    submissionTimestamp: {
      type: Date,
      default: Date.now,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    verificationStatus: {
      type: String,
      enum: Object.values(TransportVerificationStatus),
      default: TransportVerificationStatus.UNVERIFIED,
    },
    reviewStatus: {
      type: String,
      enum: Object.values(TransportReviewStatus),
      default: TransportReviewStatus.PENDING,
    },
    anomalyFlags: [AnomalyFlagSchema],
    moderationHistory: [ModerationHistorySchema],
    isAppealRequested: {
      type: Boolean,
      default: false,
    },
    appealNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Appeal notes cannot exceed 1000 characters'],
    },
    appealSubmittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret, options) => {
        // Apply privacy preservation if not explicitly requesting submitter view
        if (!options?.includePrivate) {
          delete ret.receiptUrl;
          delete ret.userId;
          if (ret.origin?.coordinates) delete ret.origin.coordinates;
          if (ret.destination?.coordinates) delete ret.destination.coordinates;
          delete ret.moderationHistory;
        }
        return ret;
      },
    },
  }
);

// Indexes for fast corridor & statistical lookup
TransportRecordSchema.index({ 'origin.name': 1, 'destination.name': 1, vehicleCategory: 1 });
TransportRecordSchema.index({ verificationStatus: 1, reviewStatus: 1 });
TransportRecordSchema.index({ userId: 1, createdAt: -1 });
TransportRecordSchema.index({ journeyDate: -1 });
TransportRecordSchema.index({ 'routing.distanceKm': 1 });

const TransportRecord = mongoose.model('TransportRecord', TransportRecordSchema);

export default TransportRecord;
