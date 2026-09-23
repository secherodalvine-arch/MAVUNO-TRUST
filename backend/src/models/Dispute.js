/**
 * Dispute Model
 *
 * Records a factual, private transaction dispute opened by a farmer or dealer.
 *
 * IMPORTANT RULES:
 *  1. MavunoTrust is NOT a court, regulator, mediator, or government authority.
 *     The platform records dispute cases and connects participants to approved
 *     Farmer Rights Centre remedy guidance — it does NOT adjudicate legal rightness.
 *  2. A caseId is generated for each dispute for tracking purposes (e.g. DSP-2026-XXXXX).
 *  3. Dispute records are strictly PRIVATE to the participant who opened them.
 *  4. Official referral/support information comes from the Farmer Rights Centre.
 */
import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
export var DisputeCategory;
(function (DisputeCategory) {
    DisputeCategory["DELIVERY_ISSUE"] = "DELIVERY_ISSUE";
    DisputeCategory["QUANTITY_ISSUE"] = "QUANTITY_ISSUE";
    DisputeCategory["QUALITY_ISSUE"] = "QUALITY_ISSUE";
    DisputeCategory["AGREEMENT_ISSUE"] = "AGREEMENT_ISSUE";
    DisputeCategory["PAYMENT_ISSUE"] = "PAYMENT_ISSUE";
    DisputeCategory["OTHER"] = "OTHER";
})(DisputeCategory || (DisputeCategory = {}));
export var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["OPEN"] = "OPEN";
    DisputeStatus["CLOSED"] = "CLOSED";
})(DisputeStatus || (DisputeStatus = {}));
const DisputeSchema = new Schema({
    caseId: {
        type: String,
        unique: true,
        default: () => `DSP-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`,
    },
    transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
        required: [true, 'Transaction reference is required'],
    },
    openedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Opener reference is required'],
    },
    category: {
        type: String,
        enum: {
            values: Object.values(DisputeCategory),
            message: `Category must be one of: ${Object.values(DisputeCategory).join(', ')}`,
        },
        required: [true, 'Dispute category is required'],
    },
    description: {
        type: String,
        required: [true, 'Dispute description is required'],
        trim: true,
        minlength: [10, 'Description must be at least 10 characters'],
        maxlength: [3000, 'Description must not exceed 3000 characters'],
    },
    evidenceInfo: {
        type: String,
        trim: true,
        maxlength: [2000, 'Evidence info must not exceed 2000 characters'],
    },
    status: {
        type: String,
        enum: Object.values(DisputeStatus),
        default: DisputeStatus.OPEN,
    },
    closedAt: { type: Date },
    closedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
}, { timestamps: true });
DisputeSchema.index({ openedBy: 1 });
DisputeSchema.index({ transactionId: 1 });
DisputeSchema.index({ openedBy: 1, transactionId: 1, status: 1 });
const Dispute = mongoose.model('Dispute', DisputeSchema);
export default Dispute;
