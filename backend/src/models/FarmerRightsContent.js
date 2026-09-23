/**
 * FarmerRightsContent Model
 *
 * Curated rights and remedy information for the Farmer Rights Centre.
 *
 * CRITICAL RULES:
 *  1. This content is CURATED and CONTROLLED by the platform.
 *     Gemini AI does NOT generate or invent legal/rights content.
 *  2. Gemini may EXPLAIN this content conversationally, but the
 *     approved content stored here is the authoritative source.
 *  3. ElevenLabs reads approved content aloud — it does not generate content.
 *  4. The officialSource and officialContact fields ensure information
 *     is traceable to real institutions.
 *  5. Content that has not been officially verified must be clearly
 *     marked (isOfficiallyVerified: false) before display.
 *  6. The lastReviewedAt field tracks when content was last verified
 *     against official sources.
 */
import mongoose, { Schema } from 'mongoose';
export var RightsCategory;
(function (RightsCategory) {
    RightsCategory["RIGHT_TO_INFORMATION"] = "RIGHT_TO_INFORMATION";
    RightsCategory["PRIVACY"] = "PRIVACY";
    RightsCategory["ECONOMIC_PROTECTION"] = "ECONOMIC_PROTECTION";
    RightsCategory["RIGHT_TO_REMEDY"] = "RIGHT_TO_REMEDY";
})(RightsCategory || (RightsCategory = {}));
export var RightsSection;
(function (RightsSection) {
    RightsSection["BEFORE_SELLING"] = "BEFORE_SELLING";
    RightsSection["DURING_NEGOTIATION"] = "DURING_NEGOTIATION";
    RightsSection["AFTER_SELLING"] = "AFTER_SELLING";
    RightsSection["REMEDY"] = "REMEDY";
})(RightsSection || (RightsSection = {}));
const FarmerRightsContentSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        trim: true,
        maxlength: [200, 'Title must not exceed 200 characters'],
    },
    category: {
        type: String,
        enum: {
            values: Object.values(RightsCategory),
            message: `Category must be one of: ${Object.values(RightsCategory).join(', ')}`,
        },
        required: [true, 'Category is required'],
    },
    section: {
        type: String,
        enum: {
            values: Object.values(RightsSection),
            message: `Section must be one of: ${Object.values(RightsSection).join(', ')}`,
        },
        required: [true, 'Section is required'],
    },
    problem: {
        type: String,
        trim: true,
    },
    whatYouCanDo: {
        type: String,
        required: [true, 'whatYouCanDo is required'],
        trim: true,
    },
    whereToReport: {
        type: String,
        trim: true,
    },
    officialSource: {
        type: String,
        required: [true, 'Official source is required — content must be traceable'],
        trim: true,
    },
    officialContact: {
        type: String,
        trim: true,
    },
    officialUrl: {
        type: String,
        trim: true,
    },
    isOfficiallyVerified: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    displayOrder: {
        type: Number,
    },
    lastReviewedAt: {
        type: Date,
    },
}, { timestamps: true });
FarmerRightsContentSchema.index({ category: 1, isActive: 1 });
FarmerRightsContentSchema.index({ section: 1, isActive: 1 });
const FarmerRightsContent = mongoose.model('FarmerRightsContent', FarmerRightsContentSchema);
export default FarmerRightsContent;
