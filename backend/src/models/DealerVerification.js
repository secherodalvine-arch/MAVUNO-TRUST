/**
 * DealerVerification Model
 *
 * Structured audit record of licence/registration verification checks
 * performed against an external verification source.
 *
 * IMPORTANT RULES:
 *
 *  1. Gemini AI does NOT set the verification status.
 *     Status is obtained ONLY from:
 *       → AFA official API (production), OR
 *       → Demo AFA Verification API (hackathon — clearly labelled AFA_DEMO).
 *
 *  2. The system must NEVER claim a demo API result is an official AFA result.
 *
 *  3. A positive verification status does NOT imply that a dealer is
 *     trustworthy, or that a transaction will succeed. These are distinct.
 *
 *  4. Verification records are preserved as a history — multiple records
 *     may exist per dealer (each check is a new record).
 *
 *  5. Ratings and transactions are separate from verification.
 */
import mongoose, { Schema } from 'mongoose';
import { VerificationStatus, VerificationSource } from './DealerProfile.js';
const DealerVerificationSchema = new Schema({
    dealerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Dealer reference is required'],
    },
    licenceNumber: {
        type: String,
        required: [true, 'Licence number is required'],
        trim: true,
    },
    licenceType: {
        type: String,
        trim: true,
    },
    cropSector: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: {
            values: Object.values(VerificationStatus),
            message: `Status must be one of: ${Object.values(VerificationStatus).join(', ')}`,
        },
        required: [true, 'Verification status is required'],
    },
    source: {
        type: String,
        enum: {
            values: Object.values(VerificationSource),
            message: `Source must be one of: ${Object.values(VerificationSource).join(', ')}`,
        },
        required: [true, 'Verification source is required'],
    },
    checkedAt: {
        type: Date,
        default: Date.now,
    },
    issuedAt: { type: Date },
    expiresAt: { type: Date },
    sourceReference: {
        type: String,
        trim: true,
    },
    rawResponseRef: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
        maxlength: [500, 'Notes must not exceed 500 characters'],
    },
    checkedByUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });
DealerVerificationSchema.index({ dealerId: 1, checkedAt: -1 });
DealerVerificationSchema.index({ licenceNumber: 1 });
DealerVerificationSchema.index({ status: 1 });
const DealerVerification = mongoose.model('DealerVerification', DealerVerificationSchema);
export default DealerVerification;
