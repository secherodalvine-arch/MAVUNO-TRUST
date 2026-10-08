import mongoose from 'mongoose';

const faoPriceHistorySchema = new mongoose.Schema({
    commodity: { type: String, required: true },
    country: { type: String, default: 'Kenya' },
    admin1: { type: String },
    admin2: { type: String },
    market: { type: String, required: true },
    value: { type: Number, required: true },
    currency: { type: String, required: true },
    unit: { type: String, required: true },
    date: { type: Date, required: true }, // represents reporting month
    priceType: { type: String, required: true }, // e.g., Wholesale, Retail
    dataType: { type: String, default: 'historical monthly average' },
    source: { type: String, default: 'WFP/HDX' },
    dataset: { type: String, default: 'Kenya Food Prices' },
    retrievedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure idempotency for WFP monthly data
faoPriceHistorySchema.index(
    { commodity: 1, market: 1, date: 1, priceType: 1, unit: 1, source: 1 },
    { unique: true }
);

faoPriceHistorySchema.index({ commodity: 1, date: -1 });

export default mongoose.model('FAOPriceHistory', faoPriceHistorySchema);
