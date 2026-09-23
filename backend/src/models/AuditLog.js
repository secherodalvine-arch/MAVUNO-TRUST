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
import mongoose, { Schema } from 'mongoose';

export var AuditAction;
(function (AuditAction) {
    // Auth
    AuditAction["USER_LOGIN"] = "USER_LOGIN";
    AuditAction["USER_LOGOUT"] = "USER_LOGOUT";
    AuditAction["USER_REGISTERED"] = "USER_REGISTERED";
    AuditAction["PASSWORD_CHANGED"] = "PASSWORD_CHANGED";
    AuditAction["ACCOUNT_SUSPENDED"] = "ACCOUNT_SUSPENDED";
    // Profile
    AuditAction["FARMER_PROFILE_UPDATED"] = "FARMER_PROFILE_UPDATED";
    AuditAction["DEALER_PROFILE_UPDATED"] = "DEALER_PROFILE_UPDATED";
    // Verification
    AuditAction["VERIFICATION_REQUESTED"] = "VERIFICATION_REQUESTED";
    AuditAction["VERIFICATION_COMPLETED"] = "VERIFICATION_COMPLETED";
    // Offers
    AuditAction["OFFER_CREATED"] = "OFFER_CREATED";
    AuditAction["OFFER_COUNTERED"] = "OFFER_COUNTERED";
    AuditAction["OFFER_ACCEPTED"] = "OFFER_ACCEPTED";
    AuditAction["OFFER_REJECTED"] = "OFFER_REJECTED";
    AuditAction["CREATE_OFFER"] = "CREATE_OFFER";
    AuditAction["COUNTER_OFFER"] = "COUNTER_OFFER";
    // Production Costs
    AuditAction["PRODUCTION_COST_CREATED"] = "PRODUCTION_COST_CREATED";
    AuditAction["PRODUCTION_COST_UPDATED"] = "PRODUCTION_COST_UPDATED";
    AuditAction["PRODUCTION_COST_DELETED"] = "PRODUCTION_COST_DELETED";
    AuditAction["CREATE_PRODUCTION_COST"] = "CREATE_PRODUCTION_COST";
    AuditAction["UPDATE_PRODUCTION_COST"] = "UPDATE_PRODUCTION_COST";
    AuditAction["DELETE_PRODUCTION_COST"] = "DELETE_PRODUCTION_COST";
    // Ratings
    AuditAction["RATING_CREATED"] = "RATING_CREATED";
    AuditAction["CREATE"] = "CREATE";
    // Transactions
    AuditAction["TRANSACTION_CREATED"] = "TRANSACTION_CREATED";
    AuditAction["TRANSACTION_STATUS_CHANGED"] = "TRANSACTION_STATUS_CHANGED";
    AuditAction["PAYMENT_STATUS_CHANGED"] = "PAYMENT_STATUS_CHANGED";
    AuditAction["DELIVERY_STATUS_CHANGED"] = "DELIVERY_STATUS_CHANGED";
    // Complaints
    AuditAction["COMPLAINT_CREATED"] = "COMPLAINT_CREATED";
    AuditAction["COMPLAINT_STATUS_CHANGED"] = "COMPLAINT_STATUS_CHANGED";
    AuditAction["COMPLAINT_REFERRED"] = "COMPLAINT_REFERRED";
    // Admin
    AuditAction["ADMIN_ACTION"] = "ADMIN_ACTION";
    // Consent
    AuditAction["CONSENT_RECORDED"] = "CONSENT_RECORDED";
})(AuditAction || (AuditAction = {}));

export var AuditResourceType;
(function (AuditResourceType) {
    AuditResourceType["USER"] = "USER";
    AuditResourceType["FARMER_PROFILE"] = "FARMER_PROFILE";
    AuditResourceType["DEALER_PROFILE"] = "DEALER_PROFILE";
    AuditResourceType["LISTING"] = "LISTING";
    AuditResourceType["OFFER"] = "OFFER";
    AuditResourceType["PRODUCTION_COST"] = "PRODUCTION_COST";
    AuditResourceType["RATING"] = "RATING";
    AuditResourceType["TRANSACTION"] = "TRANSACTION";
    AuditResourceType["COMPLAINT"] = "COMPLAINT";
    AuditResourceType["VERIFICATION"] = "VERIFICATION";
    AuditResourceType["CONSENT"] = "CONSENT";
    AuditResourceType["SYSTEM"] = "SYSTEM";
})(AuditResourceType || (AuditResourceType = {}));

const AuditLogSchema = new Schema({
    actorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    actorRole: {
        type: String,
        trim: true,
        default: 'FARMER',
    },
    action: {
        type: String,
        enum: {
            values: Object.values(AuditAction),
            message: `Action must be a valid AuditAction value`,
        },
        required: [true, 'Action is required'],
    },
    resourceType: {
        type: String,
        enum: Object.values(AuditResourceType),
        default: AuditResourceType.SYSTEM,
        required: [true, 'Resource type is required'],
    },
    resourceId: {
        type: String,
        trim: true,
    },
    details: {
        type: Schema.Types.Mixed,
    },
    metadata: {
        type: Schema.Types.Mixed,
    },
    ipAddress: {
        type: String,
        trim: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: false,
    strict: false,
});

AuditLogSchema.pre('validate', function() {
    if (!this.actorId && this.get('userId')) {
        this.actorId = this.get('userId');
    }
    if (!this.resourceType) {
        this.resourceType = AuditResourceType.SYSTEM;
    }
});

AuditLogSchema.index({ actorId: 1, timestamp: -1 });
AuditLogSchema.index({ resourceType: 1, resourceId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
export default AuditLog;
