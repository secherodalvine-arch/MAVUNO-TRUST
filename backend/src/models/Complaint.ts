/**
 * Complaint Model
 *
 * Records farmer-initiated complaints or disputes about a transaction or
 * rights issue, along with a platform-generated case reference.
 *
 * IMPORTANT:
 *  1. MavunoTrust is NOT a court, regulator, or lawyer.
 *     The platform records cases and provides possible next steps and
 *     official referral information — it does NOT adjudicate final outcomes.
 *  2. A caseId is generated for each complaint for tracking purposes.
 *  3. Evidence references (message IDs, transaction records, uploaded files)
 *     are stored as references — not duplicated inline.
 *  4. Official referral information (where to report, contacts) comes from
 *     the Farmer Rights Centre curated content — not from Gemini AI.
 */

import mongoose, { Document, Schema, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export enum ComplaintCategory {
  NON_PAYMENT         = 'NON_PAYMENT',
  PRICE_DISPUTE       = 'PRICE_DISPUTE',
  QUANTITY_DISPUTE    = 'QUANTITY_DISPUTE',
  QUALITY_DISPUTE     = 'QUALITY_DISPUTE',
  MISREPRESENTATION   = 'MISREPRESENTATION',
  LICENCE_CONCERN     = 'LICENCE_CONCERN',
  PRIVACY_CONCERN     = 'PRIVACY_CONCERN',
  HARASSMENT          = 'HARASSMENT',
  OTHER               = 'OTHER',
}

export enum ComplaintStatus {
  OPEN         = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REFERRED     = 'REFERRED',   // referred to official institution
  RESOLVED     = 'RESOLVED',
  CLOSED       = 'CLOSED',
}

export interface IComplaint extends Document {
  caseId:             string;       // human-readable case reference e.g. MT-2024-XXXXX
  reporterId:         Types.ObjectId; // ref: User — who reported
  respondentId?:      Types.ObjectId; // ref: User — who the complaint is about
  transactionId?:     Types.ObjectId; // ref: Transaction (if applicable)
  category:           ComplaintCategory;
  description:        string;
  evidenceRefs?:      string[];     // message IDs, file references, etc.
  status:             ComplaintStatus;
  adminNotes?:        string;       // internal admin review notes
  resolutionNotes?:   string;       // resolution details (if resolved)
  officialReferralInfo?: string;    // where the case was referred (institution name/contact)
  referralDate?:      Date;
  createdAt:          Date;
  updatedAt:          Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    caseId: {
      type:    String,
      unique:  true,
      default: () => `MT-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`,
    },
    reporterId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Reporter reference is required'],
    },
    respondentId: {
      type: Schema.Types.ObjectId,
      ref:  'User',
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref:  'Transaction',
    },
    category: {
      type:     String,
      enum:     {
        values:  Object.values(ComplaintCategory),
        message: `Category must be one of: ${Object.values(ComplaintCategory).join(', ')}`,
      },
      required: [true, 'Complaint category is required'],
    },
    description: {
      type:      String,
      required:  [true, 'Complaint description is required'],
      trim:      true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [3000, 'Description must not exceed 3000 characters'],
    },
    evidenceRefs: {
      type: [String],
    },
    status: {
      type:    String,
      enum:    Object.values(ComplaintStatus),
      default: ComplaintStatus.OPEN,
    },
    adminNotes: {
      type:   String,
      select: false, // not returned to normal users
    },
    resolutionNotes: {
      type:  String,
      trim:  true,
    },
    officialReferralInfo: {
      type:  String,
      trim:  true,
    },
    referralDate: { type: Date },
  },
  { timestamps: true }
);

ComplaintSchema.index({ reporterId: 1 });
ComplaintSchema.index({ status: 1 });

const Complaint = mongoose.model<IComplaint>('Complaint', ComplaintSchema);
export default Complaint;
