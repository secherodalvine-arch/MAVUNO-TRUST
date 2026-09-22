/**
 * FarmerExpense Model
 *
 * PRIVATE production cost records for a farmer.
 *
 * BUSINESS PURPOSE:
 *   Enables the farmer to record production costs so the system can help
 *   calculate: total cost, cost per unit, break-even price, estimated P&L.
 *
 * PRIVACY:
 *   These records are strictly PRIVATE to the farmer.
 *   They MUST NEVER be returned in any public API response.
 *   Authorization will enforce: only the owning farmer can read/write.
 *   Even admins should have restricted access (audit only).
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export enum ExpenseCategory {
  SEEDS        = 'SEEDS',
  FERTILIZER   = 'FERTILIZER',
  LABOUR       = 'LABOUR',
  TRANSPORT    = 'TRANSPORT',
  WATER        = 'WATER',
  PEST_CONTROL = 'PEST_CONTROL',
  EQUIPMENT    = 'EQUIPMENT',
  LAND         = 'LAND',
  STORAGE      = 'STORAGE',
  OTHER        = 'OTHER',
}

export interface IFarmerExpense extends Document {
  farmerId:    Types.ObjectId; // ref: User (FARMER only)
  listingId?:  Types.ObjectId; // optional: link to a specific crop season/listing
  category:    ExpenseCategory;
  description: string;
  amount:      number;
  currency:    string;
  expenseDate: Date;
  notes?:      string;
  createdAt:   Date;
  updatedAt:   Date;
}

const FarmerExpenseSchema = new Schema<IFarmerExpense>(
  {
    farmerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Farmer reference is required'],
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref:  'FarmerCropListing',
    },
    category: {
      type:     String,
      enum:     {
        values:  Object.values(ExpenseCategory),
        message: `Category must be one of: ${Object.values(ExpenseCategory).join(', ')}`,
      },
      required: [true, 'Expense category is required'],
    },
    description: {
      type:      String,
      required:  [true, 'Expense description is required'],
      trim:      true,
      maxlength: [200, 'Description must not exceed 200 characters'],
    },
    amount: {
      type:     Number,
      required: [true, 'Amount is required'],
      min:      [0, 'Amount cannot be negative'],
    },
    currency: {
      type:    String,
      default: 'KES',
      trim:    true,
    },
    expenseDate: {
      type:     Date,
      required: [true, 'Expense date is required'],
      default:  Date.now,
    },
    notes: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Notes must not exceed 500 characters'],
    },
  },
  { timestamps: true }
);

// Scope queries always to farmerId — supports future per-farmer authorization
FarmerExpenseSchema.index({ farmerId: 1 });
FarmerExpenseSchema.index({ farmerId: 1, listingId: 1 });
FarmerExpenseSchema.index({ farmerId: 1, category: 1 });

const FarmerExpense = mongoose.model<IFarmerExpense>('FarmerExpense', FarmerExpenseSchema);
export default FarmerExpense;
