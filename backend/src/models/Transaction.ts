/**
 * Transaction Model
 *
 * Represents the AGREED TERMS of a transaction based on an accepted offer.
 * This does NOT mean that payment or delivery has happened.
 * It is solely a record of the agreement between the farmer and the dealer.
 *
 * PRIVACY RULES:
 *  - This model must NOT contain private production costs (e.g. seeds, fertilizer, labour).
 *  - It must NOT contain passwords, JWTs, or exact private locations.
 *  - Unrelated private messages must not be copied here.
 *  - The transaction record contains only information necessary to record the accepted agreement.
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export enum TransactionStatus {
  AGREED      = 'AGREED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED   = 'COMPLETED',
  DISPUTED    = 'DISPUTED',
  CANCELLED   = 'CANCELLED',
}

export enum FulfilmentStatus {
  PENDING     = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  FULFILLED   = 'FULFILLED',
}

export enum CancellationReason {
  MUTUAL_AGREEMENT        = 'MUTUAL_AGREEMENT',
  DELIVERY_ISSUE          = 'DELIVERY_ISSUE',
  CHANGE_OF_CIRCUMSTANCES = 'CHANGE_OF_CIRCUMSTANCES',
  OTHER                   = 'OTHER',
}

export interface IFulfilmentInfo {
  status:               FulfilmentStatus;
  expectedDate?:        Date;
  method?:              string;
  notes?:               string;
  actualFulfilmentDate?: Date;
  lastUpdatedBy?:       Types.ObjectId;
  lastUpdatedAt?:       Date;
}

export interface ITransaction extends Document {
  farmerId:           Types.ObjectId; // ref: User (FARMER)
  dealerId:           Types.ObjectId; // ref: User (DEALER)
  listingId:          Types.ObjectId; // ref: FarmerCropListing
  acceptedOfferId:    Types.ObjectId; // ref: Offer (MUST BE UNIQUE)
  cropName:           string;
  quantity:           number;
  unit:               string;
  agreedPricePerUnit: number;
  totalAgreedValue:   number;
  currency:           string;
  agreementDate:      Date;
  status:             TransactionStatus;
  fulfilment?:        IFulfilmentInfo;
  completedAt?:       Date;
  completedBy?:       Types.ObjectId;
  cancelledAt?:       Date;
  cancelledBy?:       Types.ObjectId;
  cancellationReason?: string;
  cancellationNote?:   string;
  createdAt:          Date;
  updatedAt:          Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    farmerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Farmer reference is required'],
    },
    dealerId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Dealer reference is required'],
    },
    listingId: {
      type:     Schema.Types.ObjectId,
      ref:      'FarmerCropListing',
      required: [true, 'Listing reference is required'],
    },
    acceptedOfferId: {
      type:     Schema.Types.ObjectId,
      ref:      'Offer',
      required: [true, 'Accepted Offer reference is required'],
      unique:   true, // Prevents duplicate transactions for the same offer
    },
    cropName: {
      type:     String,
      required: [true, 'Crop name is required'],
      trim:     true,
    },
    quantity: {
      type:     Number,
      required: [true, 'Quantity is required'],
      min:      [0.01, 'Quantity must be greater than 0'],
    },
    unit: {
      type:     String,
      required: [true, 'Unit is required'],
      trim:     true,
    },
    agreedPricePerUnit: {
      type:     Number,
      required: [true, 'Agreed price per unit is required'],
      min:      [0, 'Price cannot be negative'],
    },
    totalAgreedValue: {
      type:     Number,
      required: [true, 'Total agreed value is required'],
      min:      [0, 'Total value cannot be negative'],
    },
    currency: {
      type:    String,
      default: 'KES',
      trim:    true,
    },
    agreementDate: {
      type:     Date,
      required: [true, 'Agreement date is required'],
      default:  Date.now,
    },
    status: {
      type:    String,
      enum:    {
        values:  Object.values(TransactionStatus),
        message: `Status must be one of: ${Object.values(TransactionStatus).join(', ')}`,
      },
      default: TransactionStatus.AGREED,
    },
    fulfilment: {
      status: {
        type:    String,
        enum:    {
          values:  Object.values(FulfilmentStatus),
          message: `Fulfilment status must be one of: ${Object.values(FulfilmentStatus).join(', ')}`,
        },
        default: FulfilmentStatus.PENDING,
      },
      expectedDate:        Date,
      method:              { type: String, trim: true },
      notes:               { type: String, trim: true },
      actualFulfilmentDate: Date,
      lastUpdatedBy:       { type: Schema.Types.ObjectId, ref: 'User' },
      lastUpdatedAt:       Date,
    },
    completedAt: Date,
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
    cancellationReason: {
      type: String,
      enum: {
        values: Object.values(CancellationReason),
        message: `Cancellation reason must be one of: ${Object.values(CancellationReason).join(', ')}`,
      },
    },
    cancellationNote: { type: String, trim: true },
  },
  { timestamps: true }
);



TransactionSchema.index({ farmerId: 1 });
TransactionSchema.index({ dealerId: 1 });

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;
