import mongoose, { Schema } from 'mongoose';

const WRSCWeeklyPriceSchema = new Schema({
    category: {
        type: String,
        trim: true,
        description: 'e.g., cereals, Legumes, Roots & Tubers'
    },
    commodity: {
        type: String,
        required: [true, 'Commodity/Product name is required'],
        trim: true,
        description: 'e.g., Dry Maize, Rice, Beans'
    },
    variety: {
        type: String,
        required: [true, 'Variety is required'],
        trim: true,
        description: 'e.g., White Maize, Pishori, Rosecoco'
    },
    unit: {
        type: String,
        required: [true, 'Unit of measure is required'],
        trim: true,
        description: 'e.g., 90kg, 50kg'
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [0, 'Price cannot be negative']
    },
    currency: {
        type: String,
        default: 'KES',
        trim: true
    },
    publicationDate: {
        type: Date,
        required: [true, 'WordPress publication date is required'],
        description: 'The date the WRSC post was published'
    },
    postId: {
        type: Number,
        required: [true, 'WordPress Post ID is required'],
        description: "Used to prevent duplicate ingestion of the same week's data"
    },
    postUrl: {
        type: String,
        trim: true,
        description: 'The canonical URL of the source post for provenance'
    },
    retrievedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Prevent duplicate entries for the exact same commodity/variety from the same post
WRSCWeeklyPriceSchema.index({ postId: 1, commodity: 1, variety: 1 }, { unique: true });
// Optimize queries asking for recent prices of a commodity
WRSCWeeklyPriceSchema.index({ commodity: 1, publicationDate: -1 });

const WRSCWeeklyPrice = mongoose.model('WRSCWeeklyPrice', WRSCWeeklyPriceSchema);
export default WRSCWeeklyPrice;
