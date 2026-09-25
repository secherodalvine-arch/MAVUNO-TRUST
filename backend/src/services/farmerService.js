/**
 * Farmer Service — MavunoTrust Step 5
 *
 * Handles farmer profile management, privacy filtering, and crop listings.
 *
 * PRIVACY RULES:
 *  1. _privateExactLocation is NEVER returned in public profiles.
 *  2. Public profiles only expose generalArea/county, displayName, bio, and primaryCrops.
 *  3. Ownership checks enforce that farmers can only modify their own profile and crop listings.
 */
import FarmerProfile from '../models/FarmerProfile.js';
import FarmerCropListing, { ListingStatus } from '../models/FarmerCropListing.js';
import User, { UserRole } from '../models/User.js';
import { assertOwner } from '../utils/authorizationUtils.js';
import mongoose from 'mongoose';
// ── Farmer Profile Methods ───────────────────────────────────────────────────
/**
 * Get or create profile for authenticated farmer
 */
export async function getFarmerProfileByUserId(userId) {
    let profile = await FarmerProfile.findOne({ userId });
    if (!profile) {
        const user = await User.findById(userId);
        if (!user)
            throw Object.assign(new Error('User not found.'), { statusCode: 404 });
        profile = await FarmerProfile.create({
            userId: user._id,
            displayName: user.fullName,
        });
    }
    return profile;
}
/**
 * Update authenticated farmer's profile
 */
export async function updateFarmerProfile(userId, input) {
    const profile = await getFarmerProfileByUserId(userId);
    // Ownership check
    assertOwner({ userId, role: UserRole.FARMER }, profile.userId);
    if (input.displayName !== undefined)
        profile.displayName = input.displayName.trim();
    if (input.bio !== undefined)
        profile.bio = input.bio.trim();
    if (input.generalArea !== undefined)
        profile.generalArea = input.generalArea.trim();
    if (input.county !== undefined)
        profile.county = input.county.trim();
    if (input.primaryCrops !== undefined)
        profile.primaryCrops = input.primaryCrops;
    if (input.estimatedAnnualYield !== undefined)
        profile.estimatedAnnualYield = input.estimatedAnnualYield;
    if (input.yieldUnit !== undefined)
        profile.yieldUnit = input.yieldUnit.trim();
    if (input.expectedSellingPeriod !== undefined)
        profile.expectedSellingPeriod = input.expectedSellingPeriod.trim();
    if (input.isPublicProfile !== undefined)
        profile.isPublicProfile = input.isPublicProfile;
    if (input._privateExactLocation !== undefined)
        profile._privateExactLocation = input._privateExactLocation.trim();
    await profile.save();
    return profile;
}
/**
 * Get public profile by farmer profile ID or user ID — strips private fields
 */
export async function getPublicFarmerProfile(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { userId: id }] } : { userId: id };
    // Explicitly do NOT select _privateExactLocation
    const profile = await FarmerProfile.findOne(query).select('-__v -_privateExactLocation');
    if (!profile) {
        throw Object.assign(new Error('Farmer profile not found.'), { statusCode: 404 });
    }
    if (!profile.isPublicProfile) {
        throw Object.assign(new Error('This profile is set to private.'), { statusCode: 403 });
    }
    return profile.toObject();
}
// ── Farmer Crop Listing Methods ──────────────────────────────────────────────
/**
 * Create a new crop listing for authenticated farmer
 */
export async function createCropListing(userId, input) {
    if (!input.estimatedQuantity || input.estimatedQuantity <= 0) {
        throw Object.assign(new Error('Estimated quantity must be greater than 0.'), { statusCode: 400 });
    }
    if (!input.unit || !input.unit.trim()) {
        throw Object.assign(new Error('Unit is required.'), { statusCode: 400 });
    }
    // Retrieve farmer profile to default location if not specified in listing
    const farmerProfile = await getFarmerProfileByUserId(userId);
    const listing = await FarmerCropListing.create({
        farmerId: new mongoose.Types.ObjectId(userId),
        cropName: input.cropName?.trim() || 'General Produce',
        cropId: input.cropId ? new mongoose.Types.ObjectId(input.cropId) : undefined,
        estimatedQuantity: input.estimatedQuantity,
        unit: input.unit.trim(),
        priceExpectationPerUnit: input.priceExpectationPerUnit,
        currency: input.currency || 'KES',
        expectedSellingPeriodStart: input.expectedSellingPeriodStart ? new Date(input.expectedSellingPeriodStart) : undefined,
        expectedSellingPeriodEnd: input.expectedSellingPeriodEnd ? new Date(input.expectedSellingPeriodEnd) : undefined,
        generalArea: input.generalArea?.trim() || farmerProfile.generalArea,
        county: input.county?.trim() || farmerProfile.county,
        additionalNotes: input.additionalNotes?.trim(),
        status: input.status || ListingStatus.ACTIVE,
    });
    return listing;
}
/**
 * Get all crop listings owned by authenticated farmer
 */
export async function getMyCropListings(userId) {
    return FarmerCropListing.find({ farmerId: userId }).sort({ createdAt: -1 });
}
/**
 * Public listing of active crop offerings for search/matching
 */
export async function getPublicCropListings(filter) {
    const query = {};
    if (filter?.county) {
        query.county = { $regex: filter.county, $options: 'i' };
    }
    if (filter?.cropName) {
        query.cropName = { $regex: filter.cropName, $options: 'i' };
    }
    // Exclude cancelled or sold listings if status exists
    query.status = { $nin: ['SOLD', 'CANCELLED', 'EXPIRED'] };
    return FarmerCropListing.find(query).populate('farmerId', 'fullName email phoneNumber').sort({ createdAt: -1 });
}
/**
 * Get single crop listing by ID
 */
export async function getCropListingById(listingId) {
    const listing = await FarmerCropListing.findById(listingId);
    if (!listing) {
        throw Object.assign(new Error('Crop listing not found.'), { statusCode: 404 });
    }
    return listing;
}
/**
 * Update authenticated farmer's crop listing
 */
export async function updateCropListing(userId, listingId, input) {
    const listing = await getCropListingById(listingId);
    // Ownership check
    assertOwner({ userId, role: UserRole.FARMER }, listing.farmerId);
    if (input.cropName !== undefined)
        listing.cropName = input.cropName.trim();
    if (input.estimatedQuantity !== undefined) {
        if (input.estimatedQuantity <= 0)
            throw Object.assign(new Error('Quantity must be greater than 0.'), { statusCode: 400 });
        listing.estimatedQuantity = input.estimatedQuantity;
    }
    if (input.unit !== undefined)
        listing.unit = input.unit.trim();
    if (input.priceExpectationPerUnit !== undefined)
        listing.priceExpectationPerUnit = input.priceExpectationPerUnit;
    if (input.expectedSellingPeriodStart !== undefined)
        listing.expectedSellingPeriodStart = new Date(input.expectedSellingPeriodStart);
    if (input.expectedSellingPeriodEnd !== undefined)
        listing.expectedSellingPeriodEnd = new Date(input.expectedSellingPeriodEnd);
    if (input.generalArea !== undefined)
        listing.generalArea = input.generalArea.trim();
    if (input.county !== undefined)
        listing.county = input.county.trim();
    if (input.additionalNotes !== undefined)
        listing.additionalNotes = input.additionalNotes.trim();
    if (input.status !== undefined)
        listing.status = input.status;
    await listing.save();
    return listing;
}
/**
 * Delete authenticated farmer's crop listing
 */
export async function deleteCropListing(userId, listingId) {
    const listing = await getCropListingById(listingId);
    // Ownership check
    assertOwner({ userId, role: UserRole.FARMER }, listing.farmerId);
    await listing.deleteOne();
}
