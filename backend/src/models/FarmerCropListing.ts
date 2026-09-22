/**
 * FarmerCropListing Model
 *
 * Represents what a specific farmer is publicly offering for sale.
 *
 * PRIVACY:
 *   listingArea reflects only a general location (e.g. "Nakuru County") —
 *   the farmer's exact farm/home address is NEVER stored here.
 *   Exact location remains in FarmerProfile._privateExactLocation
 *   and is only accessible with explicit consent during delivery.
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export enum ListingStatus {
  ACTIVE    = 'ACTIVE',
  PAUSED    = 'PAUSED',
  SOLD      = 'SOLD',
  EXPIRED   = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface IFarmerCropListing extends Document {
  farmerId:              Types.ObjectId; // ref: User
  cropId?:               Types.ObjectId; // ref: Crop
  cropName?:             string;
  estimatedQuantity:     number;
  unit:                  string;
  priceExpectationPerUnit?: number;
  currency:              string;
  expectedSellingPeriodStart?: Date;
  expectedSellingPeriodEnd?:   Date;
  generalArea?:          string;  // General public location only — NOT exact address
  county?:               string;
  additionalNotes?:      string;
  status:                ListingStatus;
  createdAt:             Date;
  updatedAt:             Date;
}

const FarmerCropListingSchema = new Schema<IFarmerCropListing>(
  {
    farmerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Farmer reference is required'],
    },
    cropId: {
      type:     Schema.Types.ObjectId,
      ref:      'Crop',
      required: false,
    },
    cropName: {
      type:     String,
      trim:     true,
    },
    estimatedQuantity: {
      type:     Number,
      required: [true, 'Estimated quantity is required'],
      min:      [0.01, 'Quantity must be greater than 0'],
    },
    unit: {
      type:     String,
      required: [true, 'Unit is required'],
      trim:     true,
    },
    priceExpectationPerUnit: {
      type: Number,
      min:  [0, 'Price cannot be negative'],
    },
    currency: {
      type:    String,
      default: 'KES',
      trim:    true,
    },
    expectedSellingPeriodStart: { type: Date },
    expectedSellingPeriodEnd:   { type: Date },
    // Public-facing area — general only, never exact location.
    generalArea: {
      type:  String,
      trim:  true,
    },
    county: {
      type:  String,
      trim:  true,
    },
    additionalNotes: {
      type:      String,
      trim:      true,
      maxlength: [1000, 'Notes must not exceed 1000 characters'],
    },
    status: {
      type:    String,
      enum:    {
        values:  Object.values(ListingStatus),
        message: `Status must be one of: ${Object.values(ListingStatus).join(', ')}`,
      },
      default: ListingStatus.ACTIVE,
    },
  },
  { timestamps: true }
);

FarmerCropListingSchema.index({ farmerId: 1 });
FarmerCropListingSchema.index({ cropId: 1 });
FarmerCropListingSchema.index({ status: 1 });
FarmerCropListingSchema.index({ county: 1, status: 1 });

const FarmerCropListing = mongoose.model<IFarmerCropListing>('FarmerCropListing', FarmerCropListingSchema);
export default FarmerCropListing;
