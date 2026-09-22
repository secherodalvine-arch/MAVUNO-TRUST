/**
 * Crop Model
 *
 * Reusable reference catalogue of agricultural crops / products.
 * Avoids hardcoding crop lists in frontend components.
 *
 * Used by: FarmerCropListing, MarketPrice, Offer, Transaction, DealerProfile
 */

import mongoose, { Document, Schema } from 'mongoose';

export enum CropCategory {
  CEREALS      = 'CEREALS',
  LEGUMES      = 'LEGUMES',
  VEGETABLES   = 'VEGETABLES',
  FRUITS       = 'FRUITS',
  ROOT_CROPS   = 'ROOT_CROPS',
  OILSEEDS     = 'OILSEEDS',
  CASH_CROPS   = 'CASH_CROPS',
  LIVESTOCK    = 'LIVESTOCK',
  DAIRY        = 'DAIRY',
  POULTRY      = 'POULTRY',
  OTHER        = 'OTHER',
}

export interface ICrop extends Document {
  cropName:    string;
  category:    CropCategory;
  description?: string;
  commonUnit:  string; // e.g. "kg", "bag (90kg)", "crate"
  isActive:    boolean;
  createdAt:   Date;
  updatedAt:   Date;
}

const CropSchema = new Schema<ICrop>(
  {
    cropName: {
      type:      String,
      required:  [true, 'Crop name is required'],
      trim:      true,
      unique:    true,
      maxlength: [100, 'Crop name must not exceed 100 characters'],
    },
    category: {
      type:     String,
      enum:     {
        values:  Object.values(CropCategory),
        message: `Category must be one of: ${Object.values(CropCategory).join(', ')}`,
      },
      required: [true, 'Crop category is required'],
    },
    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description must not exceed 500 characters'],
    },
    commonUnit: {
      type:     String,
      required: [true, 'Common unit is required'],
      trim:     true,
      default:  'kg',
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

CropSchema.index({ cropName: 1 });
CropSchema.index({ category: 1 });
CropSchema.index({ isActive: 1 });

const Crop = mongoose.model<ICrop>('Crop', CropSchema);
export default Crop;
