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
import mongoose, { Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
export var ComplaintCategory;
(function (ComplaintCategory) {
    ComplaintCategory["NON_PAYMENT"] = "NON_PAYMENT";
    ComplaintCategory["PRICE_DISPUTE"] = "PRICE_DISPUTE";
    ComplaintCategory["QUANTITY_DISPUTE"] = "QUANTITY_DISPUTE";
    ComplaintCategory["QUALITY_DISPUTE"] = "QUALITY_DISPUTE";
    ComplaintCategory["MISREPRESENTATION"] = "MISREPRESENTATION";
    ComplaintCategory["LICENCE_CONCERN"] = "LICENCE_CONCERN";
    ComplaintCategory["PRIVACY_CONCERN"] = "PRIVACY_CONCERN";
    ComplaintCategory["HARASSMENT"] = "HARASSMENT";
    ComplaintCategory["OTHER"] = "OTHER";
})(ComplaintCategory || (ComplaintCategory = {}));
export var ComplaintStatus;
(function (ComplaintStatus) {
    ComplaintStatus["OPEN"] = "OPEN";
    ComplaintStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    ComplaintStatus["REFERRED"] = "REFERRED";
    ComplaintStatus["RESOLVED"] = "RESOLVED";
    ComplaintStatus["CLOSED"] = "CLOSED";
})(ComplaintStatus || (ComplaintStatus = {}));
const ComplaintSchema = new Schema({
    caseId: {
        type: String,
        unique: true,
        default: () => `MT-${new Date().getFullYear()}-${uuidv4().slice(0, 8).toUpperCase()}`,
    },
    reporterId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reporter reference is required'],
    },
    respondentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    transactionId: {
        type: Schema.Types.ObjectId,
        ref: 'Transaction',
    },
    category: {
        type: String,
        enum: {
            values: Object.values(ComplaintCategory),
            message: `Category must be one of: ${Object.values(ComplaintCategory).join(', ')}`,
        },
        required: [true, 'Complaint category is required'],
    },
    description: {
        type: String,
        required: [true, 'Complaint description is required'],
        trim: true,
        minlength: [20, 'Description must be at least 20 characters'],
        maxlength: [3000, 'Description must not exceed 3000 characters'],
    },
    evidenceRefs: {
        type: [String],
    },
    status: {
        type: String,
        enum: Object.values(ComplaintStatus),
        default: ComplaintStatus.OPEN,
    },
    adminNotes: {
        type: String,
        select: false, // not returned to normal users
    },
    resolutionNotes: {
        type: String,
        trim: true,
    },
    officialReferralInfo: {
        type: String,
        trim: true,
    },
    referralDate: { type: Date },
}, { timestamps: true });
ComplaintSchema.index({ reporterId: 1 });
ComplaintSchema.index({ status: 1 });
const Complaint = mongoose.model('Complaint', ComplaintSchema);
export default Complaint;
