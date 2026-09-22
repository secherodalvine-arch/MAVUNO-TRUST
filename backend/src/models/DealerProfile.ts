/**
 * DealerProfile Model
 *
 * Extends User identity with dealer/broker-specific business information.
 *
 * VERIFICATION DESIGN:
 * ─────────────────────────────────────────────────────────────────────────
 * Dealer licence status is NOT stored as a simple `isLicensed: Boolean`.
 *
 * Structured verification metadata is stored so that:
 *  1. The actual verification source is recorded (AFA official API or Demo).
 *  2. Verification timestamps are preserved for auditability.
 *  3. Expiry, suspension and revocation can be reflected accurately.
 *  4. The system never pretends a demo verification is an official one.
 *
 * Gemini AI does NOT determine licence status.
 * Status is set exclusively by the Verification Service after querying:
 *   → AFA official API (production), OR
 *   → Demo AFA Verification API (hackathon MVP — clearly labelled).
 * ─────────────────────────────────────────────────────────────────────────
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

// ── Enums ────────────────────────────────────────────────────────────────────

export enum VerificationStatus {
  ACTIVE          = 'ACTIVE',
  INACTIVE        = 'INACTIVE',
  EXPIRED         = 'EXPIRED',
  SUSPENDED       = 'SUSPENDED',
  REVOKED         = 'REVOKED',
  UNABLE_TO_VERIFY = 'UNABLE_TO_VERIFY',
  PENDING         = 'PENDING',
}

export enum VerificationSource {
  AFA_OFFICIAL = 'AFA_OFFICIAL',
  AFA_DEMO     = 'AFA_DEMO',       // clearly labelled demo — NOT real government data
  MANUAL_REVIEW = 'MANUAL_REVIEW', // admin-reviewed (future)
  NOT_CHECKED  = 'NOT_CHECKED',
}

// ── Verification Sub-document ─────────────────────────────────────────────────

interface ILicenceVerification {
  licenceNumber?:      string;
  licenceType?:        string;
  cropSector?:         string;   // e.g. "Cereals", "Horticulture"
  issuedAt?:           Date;
  expiresAt?:          Date;
  status:              VerificationStatus;
  source:              VerificationSource;
  verifiedAt?:         Date;
  sourceReference?:    string;   // API response reference/ID
  notes?:              string;   // e.g. reason for SUSPENDED/REVOKED
}

// ── Interface ────────────────────────────────────────────────────────────────

export interface IDealerProfile extends Document {
  userId:              Types.ObjectId;
  businessName?:       string;
  displayName:         string;
  bio?:                string;
  generalOperatingArea?: string;
  countiesServed?:     string[];
  cropsDealt?:         string[];
  purchasingCapacityKg?: number;
  businessRegNumber?:  string;
  licence:             ILicenceVerification;
  isPublicProfile:     boolean;
  createdAt:           Date;
  updatedAt:           Date;
}

// ── Schema ───────────────────────────────────────────────────────────────────

const LicenceVerificationSchema = new Schema<ILicenceVerification>(
  {
    licenceNumber:   { type: String, trim: true },
    licenceType:     { type: String, trim: true },
    cropSector:      { type: String, trim: true },
    issuedAt:        { type: Date },
    expiresAt:       { type: Date },
    status: {
      type:    String,
      enum:    {
        values:  Object.values(VerificationStatus),
        message: `Verification status must be one of: ${Object.values(VerificationStatus).join(', ')}`,
      },
      default: VerificationStatus.PENDING,
    },
    source: {
      type:    String,
      enum:    Object.values(VerificationSource),
      default: VerificationSource.NOT_CHECKED,
    },
    verifiedAt:      { type: Date },
    sourceReference: { type: String, trim: true },
    notes:           { type: String, trim: true },
  },
  { _id: false } // embedded sub-document, no separate _id needed
);

const DealerProfileSchema = new Schema<IDealerProfile>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Dealer user reference is required'],
      unique:   true,
    },
    businessName: {
      type:  String,
      trim:  true,
      maxlength: [150, 'Business name must not exceed 150 characters'],
    },
    displayName: {
      type:      String,
      required:  [true, 'Display name is required'],
      trim:      true,
      maxlength: [100, 'Display name must not exceed 100 characters'],
    },
    bio: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Bio must not exceed 500 characters'],
    },
    generalOperatingArea: {
      type:  String,
      trim:  true,
    },
    countiesServed: {
      type: [String],
    },
    cropsDealt: {
      type: [String],
    },
    purchasingCapacityKg: {
      type: Number,
      min:  [0, 'Purchasing capacity cannot be negative'],
    },
    businessRegNumber: {
      type:   String,
      trim:   true,
      select: false, // not returned by default — sensitive business info
    },
    licence: {
      type:    LicenceVerificationSchema,
      default: () => ({ status: VerificationStatus.PENDING, source: VerificationSource.NOT_CHECKED }),
    },
    isPublicProfile: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

DealerProfileSchema.index({ 'licence.status': 1 });
DealerProfileSchema.index({ isPublicProfile: 1 });

const DealerProfile = mongoose.model<IDealerProfile>('DealerProfile', DealerProfileSchema);
export default DealerProfile;
