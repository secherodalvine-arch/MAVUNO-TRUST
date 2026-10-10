import mongoose, { Schema } from 'mongoose';

export var DemandStatus;
(function (DemandStatus) {
    DemandStatus["ACTIVE"] = "ACTIVE";
    DemandStatus["FULFILLED"] = "FULFILLED";
    DemandStatus["EXPIRED"] = "EXPIRED";
    DemandStatus["CANCELLED"] = "CANCELLED";
})(DemandStatus || (DemandStatus = {}));

const BuyerDemandSchema = new Schema({
    dealerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Dealer reference is required'],
    },
    cropName: {
        type: String,
        trim: true,
        required: [true, 'Crop name is required'],
    },
    cropId: {
        type: Schema.Types.ObjectId,
        ref: 'Crop',
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
    targetPricePerUnit: {
        type: Number,
        min: [0, 'Target price cannot be negative'],
    },
    currency: {
        type: String,
        default: 'KES',
        trim: true,
    },
    desiredDeliveryDate: {
        type: Date,
    },
    countiesServed: {
        type: [String],
    },
    status: {
        type: String,
        enum: {
            values: Object.values(DemandStatus),
            message: `Status must be one of: ${Object.values(DemandStatus).join(', ')}`,
        },
        default: DemandStatus.ACTIVE,
    },
    buyerReference: {
        type: String,
        trim: true,
    },
}, { timestamps: true });

BuyerDemandSchema.index({ dealerId: 1 });
BuyerDemandSchema.index({ status: 1 });
BuyerDemandSchema.index({ cropName: 1, status: 1 });

const BuyerDemand = mongoose.model('BuyerDemand', BuyerDemandSchema);
export default BuyerDemand;
