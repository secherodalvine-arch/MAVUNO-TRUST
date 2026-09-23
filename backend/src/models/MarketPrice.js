/**
 * MarketPrice Model
 *
 * Stores externally sourced agricultural market price information.
 *
 * IMPORTANT:
 *   - Prices are sourced from external providers (e.g. Shambaboard/Shambacord).
 *   - No market prices are fabricated by MavunoTrust or Gemini.
 *   - The `source` field must always record which provider supplied the data.
 *   - The market data provider is kept replaceable via the service layer.
 *   - If no provider is integrated yet, this table stays empty.
 *   - Prices shown to farmers are informational estimates, NOT guaranteed rates.
 */
import mongoose, { Schema } from 'mongoose';
export var MarketDataSource;
(function (MarketDataSource) {
    MarketDataSource["SHAMBARECORDS"] = "SHAMBARECORDS";
    MarketDataSource["SHAMBABOARD"] = "SHAMBABOARD";
    MarketDataSource["SHAMBACORD"] = "SHAMBACORD";
    MarketDataSource["MANUAL_ENTRY"] = "MANUAL_ENTRY";
    MarketDataSource["OTHER"] = "OTHER";
    MarketDataSource["UNKNOWN"] = "UNKNOWN";
})(MarketDataSource || (MarketDataSource = {}));
const MarketPriceSchema = new Schema({
    cropId: {
        type: Schema.Types.ObjectId,
        ref: 'Crop',
    },
    cropName: {
        type: String,
        required: [true, 'Crop name is required'],
        trim: true,
    },
    market: {
        type: String,
        required: [true, 'Market location is required'],
        trim: true,
    },
    county: {
        type: String,
        trim: true,
    },
    price: {
        type: Number,
        min: [0, 'Price cannot be negative'],
    },
    minimumPrice: {
        type: Number,
        min: [0, 'Minimum price cannot be negative'],
    },
    maximumPrice: {
        type: Number,
        min: [0, 'Maximum price cannot be negative'],
    },
    unit: {
        type: String,
        required: [true, 'Unit is required'],
        trim: true,
    },
    currency: {
        type: String,
        default: 'KES',
        trim: true,
    },
    source: {
        type: String,
        enum: {
            values: Object.values(MarketDataSource),
            message: `Source must be one of: ${Object.values(MarketDataSource).join(', ')}`,
        },
        required: [true, 'Data source is required'],
    },
    sourceReference: {
        type: String,
        trim: true,
    },
    provider: {
        type: String,
        trim: true,
    },
    externalId: {
        type: String,
        trim: true,
    },
    qualityGrade: {
        type: String,
        trim: true,
    },
    notes: {
        type: String,
        trim: true,
    },
    observedAt: {
        type: Date,
        required: [true, 'Observation date is required'],
    },
    retrievedAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });
MarketPriceSchema.index({ cropId: 1, observedAt: -1 });
MarketPriceSchema.index({ cropName: 1, market: 1, observedAt: -1 });
MarketPriceSchema.index({ source: 1 });
const MarketPrice = mongoose.model('MarketPrice', MarketPriceSchema);
export default MarketPrice;
