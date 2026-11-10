/**
 * FarmerProfile Model
 *
 * Extends User identity with farmer-specific agricultural and public-facing
 * information.
 *
 * PRIVACY DESIGN:
 * ─────────────────────────────────────────────────────────────────────────
 * PUBLIC fields (visible to others on the platform):
 *   displayName, generalArea, county, bio, crops, estimatedQuantity,
 *   expectedSellingPeriod
 *
 * PRIVATE fields (never surfaced publicly — only accessible to the farmer
 * themselves or explicitly authorized parties, e.g. during a confirmed
 * transaction delivery):
 *   exactLocation (stored separately, access-controlled)
 *
 * Exact farm/home address is intentionally NOT on the public profile.
 * ─────────────────────────────────────────────────────────────────────────
 */
import mongoose, { Schema } from 'mongoose';

const GeoJSONPolygonSchema = new Schema({
    type: {
        type: String,
        enum: ['Polygon'],
        default: 'Polygon',
        required: true,
    },
    coordinates: {
        type: [[[Number]]], // Array of linear rings: [[[lng, lat], [lng, lat], ...]]
        required: true,
    },
}, { _id: false });

const FarmerProfileSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Farmer user reference is required'],
        unique: true,
    },
    displayName: {
        type: String,
        required: [true, 'Display name is required'],
        trim: true,
        maxlength: [80, 'Display name must not exceed 80 characters'],
    },
    bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio must not exceed 500 characters'],
    },
    generalArea: {
        type: String,
        trim: true,
        maxlength: [100, 'General area must not exceed 100 characters'],
    },
    subCounty: {
        type: String,
        trim: true,
        maxlength: [100, 'Sub-county must not exceed 100 characters'],
    },
    county: {
        type: String,
        trim: true,
    },
    farmSizeAcres: {
        type: Number,
        min: [0, 'Farm size cannot be negative'],
    },
    primaryCrops: {
        type: [String],
    },
    estimatedAnnualYield: {
        type: Number,
        min: [0, 'Yield cannot be negative'],
    },
    yieldUnit: {
        type: String,
        trim: true,
    },
    expectedSellingPeriod: {
        type: String,
        trim: true,
    },
    isPublicProfile: {
        type: Boolean,
        default: true,
    },
    // PRIVATE — purposely prefixed with underscore and excluded from default queries.
    // This field must NEVER be returned in public-facing API responses.
    _privateExactLocation: {
        type: String,
        select: false, // excluded from query results unless explicitly requested
    },
    // PRIVATE GPS coordinates for satellite monitoring — strictly hidden from public profiles
    latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90 degrees'],
        max: [90, 'Latitude must be between -90 and 90 degrees'],
        select: false, // excluded from queries by default
    },
    longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180 degrees'],
        max: [180, 'Longitude must be between -180 and 180 degrees'],
        select: false, // excluded from queries by default
    },
    locationUpdatedAt: {
        type: Date,
        select: false, // excluded from queries by default
    },
    // PRIVATE Farm Boundary Polygon for Sentinel-2 satellite observation
    // Strictly excluded from default queries with select: false for privacy.
    farmBoundary: {
        type: GeoJSONPolygonSchema,
        select: false,
    },
    boundaryAreaAcres: {
        type: Number,
        min: [0, 'Boundary area cannot be negative'],
        select: false,
    },
    boundaryUpdatedAt: {
        type: Date,
        select: false,
    },
}, { timestamps: true });
// ── Indexes ──────────────────────────────────────────────────────────────────
FarmerProfileSchema.index({ county: 1 });
FarmerProfileSchema.index({ isPublicProfile: 1 });
FarmerProfileSchema.index({ farmBoundary: '2dsphere' }, { sparse: true });
const FarmerProfile = mongoose.model('FarmerProfile', FarmerProfileSchema);
export default FarmerProfile;
