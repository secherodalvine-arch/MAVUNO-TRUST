/**
 * AuditLog Model
 *
 * Immutable event log recording important state changes across the platform.
 *
 * IT / ACCOUNTABILITY PURPOSE:
 *  1. Provides an auditable trail for security investigations.
 *  2. Tracks who performed what action, on what resource, at what time.
 *  3. Supports complaint evidence (e.g. "dealer changed agreed price at T").
 *  4. NOT intended for real-time system logging — for significant events only.
 *
 * SECURITY:
 *  - Sensitive values (passwords, JWT secrets) must NEVER be stored in metadata.
 *  - Audit records should be write-once (no update/delete for normal users).
 *  - Admin and system actors can create audit entries.
 */

import mongoose, { Document, Schema, Types } from 'mongoose';

export enum AuditAction {
  // Auth
  USER_LOGIN            = 'USER_LOGIN',
  USER_LOGOUT           = 'USER_LOGOUT',
  USER_REGISTERED       = 'USER_REGISTERED',
  PASSWORD_CHANGED      = 'PASSWORD_CHANGED',
  ACCOUNT_SUSPENDED     = 'ACCOUNT_SUSPENDED',
  // Profile
  FARMER_PROFILE_UPDATED = 'FARMER_PROFILE_UPDATED',
  DEALER_PROFILE_UPDATED = 'DEALER_PROFILE_UPDATED',
  // Verification
  VERIFICATION_REQUESTED = 'VERIFICATION_REQUESTED',
  VERIFICATION_COMPLETED = 'VERIFICATION_COMPLETED',
  // Offers
  OFFER_CREATED          = 'OFFER_CREATED',
  OFFER_COUNTERED        = 'OFFER_COUNTERED',
  OFFER_ACCEPTED         = 'OFFER_ACCEPTED',
  OFFER_REJECTED         = 'OFFER_REJECTED',
  // Transactions
  TRANSACTION_CREATED    = 'TRANSACTION_CREATED',
  TRANSACTION_STATUS_CHANGED = 'TRANSACTION_STATUS_CHANGED',
  PAYMENT_STATUS_CHANGED = 'PAYMENT_STATUS_CHANGED',
  DELIVERY_STATUS_CHANGED = 'DELIVERY_STATUS_CHANGED',
  // Complaints
  COMPLAINT_CREATED      = 'COMPLAINT_CREATED',
  COMPLAINT_STATUS_CHANGED = 'COMPLAINT_STATUS_CHANGED',
  COMPLAINT_REFERRED     = 'COMPLAINT_REFERRED',
  // Admin
  ADMIN_ACTION           = 'ADMIN_ACTION',
  // Consent
  CONSENT_RECORDED       = 'CONSENT_RECORDED',
}

export enum AuditResourceType {
  USER         = 'USER',
  FARMER_PROFILE = 'FARMER_PROFILE',
  DEALER_PROFILE = 'DEALER_PROFILE',
  LISTING      = 'LISTING',
  OFFER        = 'OFFER',
  PRODUCTION_COST = 'PRODUCTION_COST',
  RATING          = 'RATING',
  TRANSACTION  = 'TRANSACTION',
  COMPLAINT    = 'COMPLAINT',
  VERIFICATION = 'VERIFICATION',
  CONSENT      = 'CONSENT',
  SYSTEM       = 'SYSTEM',
}

export interface IAuditLog extends Document {
  actorId:       Types.ObjectId | null; // who performed it (null = system)
  actorRole?:    string;
  action:        AuditAction;
  resourceType:  AuditResourceType;
  resourceId?:   string;     // the ID of the affected record
  metadata?:     Record<string, unknown>; // additional context — NO secrets
  ipAddress?:    string;     // for login events
  timestamp:     Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorId: {
      type:    Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    actorRole: {
      type:  String,
      trim:  true,
    },
    action: {
      type:     String,
      enum:     {
        values:  Object.values(AuditAction),
        message: `Action must be a valid AuditAction value`,
      },
      required: [true, 'Action is required'],
    },
    resourceType: {
      type:     String,
      enum:     Object.values(AuditResourceType),
      required: [true, 'Resource type is required'],
    },
    resourceId: {
      type:  String,
      trim:  true,
    },
    // metadata must never contain: passwords, hashes, JWT tokens, API keys
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type:  String,
      trim:  true,
      // Stored for security/login events; subject to data minimization policies
    },
    timestamp: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps:  false, // Using custom `timestamp` field for precision
    // Audit logs should not be updated — enforce at app layer
  }
);

AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
