/**
 * UserConsent Model
 *
 * Records explicit user consent for privacy-sensitive features.
 *
 * DATA MINIMIZATION PRINCIPLE:
 *  Only collect consent for features that genuinely need it.
 *  Do not pre-collect consent for features not yet built.
 *
 * PRIVACY RULES:
 *  1. Privacy notice acknowledgement is required at registration.
 *  2. Location sharing requires separate explicit consent.
 *  3. Conversation recording — if ever implemented — requires EXPLICIT
 *     opt-in. Silent recording is not permitted by this architecture.
 *  4. Each consent record is timestamped for auditability.
 *  5. Consent may be withdrawn — withdrawalRecordedAt tracks this.
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export enum ConsentType {
  PRIVACY_NOTICE            = 'PRIVACY_NOTICE',
  LOCATION_SHARING          = 'LOCATION_SHARING',
  COMMUNICATION_RECORDING   = 'COMMUNICATION_RECORDING', // must never be silently active
  MARKETING                 = 'MARKETING',
  DATA_PROCESSING           = 'DATA_PROCESSING',
}

export interface IUserConsent extends Document {
  userId:              Types.ObjectId;
  consentType:         ConsentType;
  consentGiven:        boolean;
  consentGivenAt:      Date;
  consentVersion?:     string;      // version of the consent notice accepted
  withdrawalRecordedAt?: Date;
  ipAddress?:          string;
  createdAt:           Date;
  updatedAt:           Date;
}

const UserConsentSchema = new Schema<IUserConsent>(
  {
    userId: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'User reference is required'],
    },
    consentType: {
      type:     String,
      enum:     {
        values:  Object.values(ConsentType),
        message: `Consent type must be one of: ${Object.values(ConsentType).join(', ')}`,
      },
      required: [true, 'Consent type is required'],
    },
    consentGiven: {
      type:     Boolean,
      required: [true, 'consentGiven must be explicitly stated'],
    },
    consentGivenAt: {
      type:    Date,
      default: Date.now,
    },
    consentVersion: {
      type:  String,
      trim:  true,
    },
    withdrawalRecordedAt: {
      type: Date,
    },
    ipAddress: {
      type:  String,
      trim:  true,
    },
  },
  { timestamps: true }
);

// One consent record per user per type (upsert on change)
UserConsentSchema.index({ userId: 1, consentType: 1 });

const UserConsent = mongoose.model<IUserConsent>('UserConsent', UserConsentSchema);
export default UserConsent;
