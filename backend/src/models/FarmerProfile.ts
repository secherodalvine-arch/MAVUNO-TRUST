/**
 * FarmerProfile Model
 *
 * Extends User identity with farmer-specific agricultural and public-facing
 * information.
 *
 * PRIVACY DESIGN:
 * ─────────────────────────────────────────────────────────────────────────
 * PUBLIC fields (visible to others on the platform):
 *   displayName, generalArea, county, bio, crops, estimatedQuantity,
 *   expectedSellingPeriod
 *
 * PRIVATE fields (never surfaced publicly — only accessible to the farmer
 * themselves or explicitly authorized parties, e.g. during a confirmed
 * transaction delivery):
 *   exactLocation (stored separately, access-controlled)
 *
 * Exact farm/home address is intentionally NOT on the public profile.
 * ─────────────────────────────────────────────────────────────────────────
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IFarmerProfile extends Document {
  userId:                Types.ObjectId;
  displayName:           string;
  bio?:                  string;
  generalArea?:          string; // e.g. "Nakuru North"
  county?:               string; // e.g. "Nakuru"
  // Public crop interest / offerings (crop names — FK to CropListing for detail)
  primaryCrops?:         string[];
  // Privately estimated quantities the farmer works with (helps with matching)
  estimatedAnnualYield?: number;
  yieldUnit?:            string;
  expectedSellingPeriod?: string; // e.g. "March–May"
  isPublicProfile:       boolean;
  // Private exact location — NOT exposed via public API.
  // Shared only with explicit consent during confirmed delivery.
  _privateExactLocation?: string;
  createdAt:             Date;
  updatedAt:             Date;
}

const FarmerProfileSchema = new Schema<IFarmerProfile>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Farmer user reference is required'],
      unique:   true,
    },
    displayName: {
      type:      String,
      required:  [true, 'Display name is required'],
      trim:      true,
      maxlength: [80, 'Display name must not exceed 80 characters'],
    },
    bio: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Bio must not exceed 500 characters'],
    },
    generalArea: {
      type:      String,
      trim:      true,
      maxlength: [100, 'General area must not exceed 100 characters'],
    },
    county: {
      type:  String,
      trim:  true,
    },
    primaryCrops: {
      type: [String],
    },
    estimatedAnnualYield: {
      type: Number,
      min:  [0, 'Yield cannot be negative'],
    },
    yieldUnit: {
      type:  String,
      trim:  true,
    },
    expectedSellingPeriod: {
      type:  String,
      trim:  true,
    },
    isPublicProfile: {
      type:    Boolean,
      default: true,
    },
    // PRIVATE — purposely prefixed with underscore and excluded from default queries.
    // This field must NEVER be returned in public-facing API responses.
    _privateExactLocation: {
      type:   String,
      select: false, // excluded from query results unless explicitly requested
    },
  },
  { timestamps: true }
);

// ── Indexes ──────────────────────────────────────────────────────────────────

FarmerProfileSchema.index({ county: 1 });
FarmerProfileSchema.index({ isPublicProfile: 1 });

const FarmerProfile = mongoose.model<IFarmerProfile>('FarmerProfile', FarmerProfileSchema);
export default FarmerProfile;
