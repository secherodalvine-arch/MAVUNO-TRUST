/**
 * Offer Model
 *
 * Represents a formal price/quantity offer made by a dealer to a farmer
 * (or counter-offer in either direction) referencing a crop listing.
 *
 * BUSINESS PURPOSE:
 *   Preserves the negotiation history so that:
 *   - Both parties have a clear record.
 *   - An accepted offer can be converted to a Transaction.
 *   - A dispute can reference the original agreed terms.
 *
 * NOTE:
 *   The system shows "potential match" language — it does NOT guarantee
 *   a dealer is trustworthy or that a transaction will succeed.
 */
import mongoose, { Schema } from 'mongoose';
export var OfferStatus;
(function (OfferStatus) {
    OfferStatus["PENDING"] = "PENDING";
    OfferStatus["COUNTERED"] = "COUNTERED";
    OfferStatus["ACCEPTED"] = "ACCEPTED";
    OfferStatus["REJECTED"] = "REJECTED";
    OfferStatus["WITHDRAWN"] = "WITHDRAWN";
    OfferStatus["EXPIRED"] = "EXPIRED";
})(OfferStatus || (OfferStatus = {}));
const OfferSchema = new Schema({
    farmerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Farmer reference is required'],
    },
    dealerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Dealer reference is required'],
    },
    listingId: {
        type: Schema.Types.ObjectId,
        ref: 'FarmerCropListing',
        required: [true, 'Listing reference is required'],
    },
    quantity: {
        type: Number,
        required: [true, 'Quantity is required'],
        min: [0.01, 'Quantity must be greater than 0'],
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        trim: true,
    },
    proposedPricePerUnit: {
        type: Number,
        required: [true, 'Proposed price per unit is required'],
        min: [0, 'Price cannot be negative'],
    },
    currency: {
        type: String,
        default: 'KES',
        trim: true,
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
        min: [0, 'Total amount cannot be negative'],
    },
    initiatedBy: {
        type: String,
        enum: ['FARMER', 'DEALER'],
        required: [true, 'initiatedBy is required'],
    },
    message: {
        type: String,
        trim: true,
        maxlength: [1000, 'Message must not exceed 1000 characters'],
    },
    parentOfferId: {
        type: Schema.Types.ObjectId,
        ref: 'Offer',
    },
    status: {
        type: String,
        enum: {
            values: Object.values(OfferStatus),
            message: `Status must be one of: ${Object.values(OfferStatus).join(', ')}`,
        },
        default: OfferStatus.PENDING,
    },
    expiresAt: { type: Date },
}, { timestamps: true });
OfferSchema.index({ farmerId: 1 });
OfferSchema.index({ dealerId: 1 });
OfferSchema.index({ listingId: 1 });
OfferSchema.index({ status: 1 });
const Offer = mongoose.model('Offer', OfferSchema);
export default Offer;
