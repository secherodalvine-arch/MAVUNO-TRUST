/**
 * Crop Model
 *
 * Reusable reference catalogue of agricultural crops / products.
 * Avoids hardcoding crop lists in frontend components.
 *
 * Used by: FarmerCropListing, MarketPrice, Offer, Transaction, DealerProfile
 */
import mongoose, { Schema } from 'mongoose';
export var CropCategory;
(function (CropCategory) {
    CropCategory["CEREALS"] = "CEREALS";
    CropCategory["LEGUMES"] = "LEGUMES";
    CropCategory["VEGETABLES"] = "VEGETABLES";
    CropCategory["FRUITS"] = "FRUITS";
    CropCategory["ROOT_CROPS"] = "ROOT_CROPS";
    CropCategory["OILSEEDS"] = "OILSEEDS";
    CropCategory["CASH_CROPS"] = "CASH_CROPS";
    CropCategory["LIVESTOCK"] = "LIVESTOCK";
    CropCategory["DAIRY"] = "DAIRY";
    CropCategory["POULTRY"] = "POULTRY";
    CropCategory["OTHER"] = "OTHER";
})(CropCategory || (CropCategory = {}));
const CropSchema = new Schema({
    cropName: {
        type: String,
        required: [true, 'Crop name is required'],
        trim: true,
        unique: true,
        maxlength: [100, 'Crop name must not exceed 100 characters'],
    },
    category: {
        type: String,
        enum: {
            values: Object.values(CropCategory),
            message: `Category must be one of: ${Object.values(CropCategory).join(', ')}`,
        },
        required: [true, 'Crop category is required'],
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description must not exceed 500 characters'],
    },
    commonUnit: {
        type: String,
        required: [true, 'Common unit is required'],
        trim: true,
        default: 'kg',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
CropSchema.index({ cropName: 1 });
CropSchema.index({ category: 1 });
CropSchema.index({ isActive: 1 });
const Crop = mongoose.model('Crop', CropSchema);
export default Crop;
