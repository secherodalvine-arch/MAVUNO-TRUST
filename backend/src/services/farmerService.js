/**
 * Farmer Service — MavunoTrust
 *
 * Handles farmer profile management, privacy filtering, crop listings,
 * satellite NDVI, weather integration, and historical observation tracking.
 *
 * PRIVACY RULES:
 *  1. _privateExactLocation is NEVER returned in public profiles.
 *  2. Public profiles only expose generalArea/county, displayName, bio, and primaryCrops.
 *  3. Ownership checks enforce that farmers can only modify their own profile and crop listings.
 */
import FarmerProfile from '../models/FarmerProfile.js';
import FarmerCropListing, { ListingStatus } from '../models/FarmerCropListing.js';
import FarmObservation from '../models/FarmObservation.js';
import User, { UserRole } from '../models/User.js';
import { assertOwner } from '../utils/authorizationUtils.js';
import { validateAndNormalizePolygon, calculateCentroid } from '../utils/polygonValidator.js';
import { calculateFarmNDVI } from './satelliteService.js';
import { generateFarmAdvisory, classifyNDVI } from './farmAdvisorService.js';
import { getFarmWeather, buildWeatherContext } from './weatherService.js';
import { requestAssistanceReferral, getAssistancePartners as listAssistancePartners } from './farmerAssistanceService.js';
import { dispatchFarmerNotification } from './notificationDispatcher.js';
import mongoose from 'mongoose';
// ── Farmer Profile Methods ───────────────────────────────────────────────────

/**
 * Coordinate validation helper for GPS coordinates
 */
export function validateCoordinates(latitude, longitude) {
    // Both omitted or undefined is valid (no coordinate update)
    if (latitude === undefined && longitude === undefined) {
        return { valid: true, shouldUpdate: false };
    }

    // Explicitly clearing coordinates (both set to null)
    if (latitude === null && longitude === null) {
        return { valid: true, shouldUpdate: true, clear: true };
    }

    // Providing only one coordinate without the other is strictly invalid
    if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
        throw Object.assign(
            new Error('Both latitude and longitude must be provided together.'),
            { statusCode: 400, code: 'INVALID_COORDINATES' }
        );
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw Object.assign(
            new Error('Latitude and longitude must be valid numeric values.'),
            { statusCode: 400, code: 'INVALID_COORDINATES' }
        );
    }

    if (lat < -90 || lat > 90) {
        throw Object.assign(
            new Error('Latitude must be between -90 and 90 degrees.'),
            { statusCode: 400, code: 'COORDINATES_OUT_OF_BOUNDS' }
        );
    }

    if (lng < -180 || lng > 180) {
        throw Object.assign(
            new Error('Longitude must be between -180 and 180 degrees.'),
            { statusCode: 400, code: 'COORDINATES_OUT_OF_BOUNDS' }
        );
    }

    return { valid: true, shouldUpdate: true, clear: false, latitude: lat, longitude: lng };
}

/**
 * Get the raw Mongoose document for a farmer profile (for internal mutation use).
 * Returns the Mongoose document so callers can mutate fields and call .save().
 * @internal — Do NOT return this document directly to API consumers; use getFarmerProfileByUserId instead.
 */
async function getFarmerProfileDocument(userId, includePrivate = false) {
    let query = FarmerProfile.findOne({ userId });
    if (includePrivate) {
        query = query.select('+latitude +longitude +locationUpdatedAt +_privateExactLocation');
    }
    let profile = await query;
    if (!profile) {
        const user = await User.findById(userId);
        if (!user)
            throw Object.assign(new Error('User not found.'), { statusCode: 404 });
        profile = await FarmerProfile.create({
            userId: user._id,
            displayName: user.fullName,
        });
    }
    return profile; // Mongoose document — has .save()
}

/**
 * Get or create profile for authenticated farmer.
 * Returns a plain object enriched with phoneNumber and email from the User model.
 * When includePrivate is true, includes private location coordinates and exact address.
 */
export async function getFarmerProfileByUserId(userId, includePrivate = false) {
    const profile = await getFarmerProfileDocument(userId, includePrivate);
    const user = await User.findById(userId).select('phoneNumber email');
    const profileObj = profile.toObject();
    profileObj.phoneNumber = user?.phoneNumber || profile.phoneNumber || '';
    profileObj.email = user?.email || '';
    return profileObj;
}

/**
 * Retrieve authenticated farmer's registered farm location & satellite coordinates
 */
export async function getFarmerLocation(userId) {
    const profile = await getFarmerProfileByUserId(userId, true);
    assertOwner({ userId, role: UserRole.FARMER }, profile.userId);

    const hasRegisteredCoordinates =
        profile.latitude !== undefined &&
        profile.latitude !== null &&
        profile.longitude !== undefined &&
        profile.longitude !== null;

    return {
        county: profile.county || '',
        subCounty: profile.subCounty || '',
        generalArea: profile.generalArea || '',
        farmSizeAcres: profile.farmSizeAcres ?? null,
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        locationUpdatedAt: profile.locationUpdatedAt || null,
        hasRegisteredCoordinates,
    };
}

/**
 * Register or update authenticated farmer's farm location & coordinates
 */
export async function updateFarmerLocation(userId, input = {}) {
    const profile = await getFarmerProfileDocument(userId, true);
    assertOwner({ userId, role: UserRole.FARMER }, profile.userId);

    // Validate coordinates
    const coordCheck = validateCoordinates(input.latitude, input.longitude);
    if (coordCheck.shouldUpdate) {
        if (coordCheck.clear) {
            profile.latitude = undefined;
            profile.longitude = undefined;
        } else {
            profile.latitude = coordCheck.latitude;
            profile.longitude = coordCheck.longitude;
        }
        profile.locationUpdatedAt = new Date();
    }

    // Validate farm size
    if (input.farmSizeAcres !== undefined) {
        if (input.farmSizeAcres === null || input.farmSizeAcres === '') {
            profile.farmSizeAcres = undefined;
        } else {
            const size = Number(input.farmSizeAcres);
            if (isNaN(size) || size < 0 || !Number.isFinite(size)) {
                throw Object.assign(
                    new Error('Farm size in acres must be a non-negative number.'),
                    { statusCode: 400, code: 'INVALID_FARM_SIZE' }
                );
            }
            profile.farmSizeAcres = size;
        }
    }

    if (input.county !== undefined)
        profile.county = input.county ? input.county.trim() : '';
    if (input.subCounty !== undefined)
        profile.subCounty = input.subCounty ? input.subCounty.trim() : '';
    if (input.generalArea !== undefined)
        profile.generalArea = input.generalArea ? input.generalArea.trim() : '';

    await profile.save();

    const hasRegisteredCoordinates =
        profile.latitude !== undefined &&
        profile.latitude !== null &&
        profile.longitude !== undefined &&
        profile.longitude !== null;

    return {
        county: profile.county || '',
        subCounty: profile.subCounty || '',
        generalArea: profile.generalArea || '',
        farmSizeAcres: profile.farmSizeAcres ?? null,
        latitude: profile.latitude ?? null,
        longitude: profile.longitude ?? null,
        locationUpdatedAt: profile.locationUpdatedAt || null,
        hasRegisteredCoordinates,
    };
}

/**
 * Update authenticated farmer's profile
 */
export async function updateFarmerProfile(userId, input) {
    const profile = await getFarmerProfileDocument(userId, true);
    // Ownership check
    assertOwner({ userId, role: UserRole.FARMER }, profile.userId);
    if (input.displayName !== undefined)
        profile.displayName = input.displayName.trim();
    if (input.bio !== undefined)
        profile.bio = input.bio.trim();
    if (input.generalArea !== undefined)
        profile.generalArea = input.generalArea.trim();
    if (input.subCounty !== undefined)
        profile.subCounty = input.subCounty.trim();
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

    // Farm size
    if (input.farmSizeAcres !== undefined) {
        if (input.farmSizeAcres === null || input.farmSizeAcres === '') {
            profile.farmSizeAcres = undefined;
        } else {
            const size = Number(input.farmSizeAcres);
            if (isNaN(size) || size < 0 || !Number.isFinite(size)) {
                throw Object.assign(
                    new Error('Farm size in acres must be a non-negative number.'),
                    { statusCode: 400, code: 'INVALID_FARM_SIZE' }
                );
            }
            profile.farmSizeAcres = size;
        }
    }

    // Coordinates update if provided
    if (input.latitude !== undefined || input.longitude !== undefined) {
        const coordCheck = validateCoordinates(input.latitude, input.longitude);
        if (coordCheck.shouldUpdate) {
            if (coordCheck.clear) {
                profile.latitude = undefined;
                profile.longitude = undefined;
            } else {
                profile.latitude = coordCheck.latitude;
                profile.longitude = coordCheck.longitude;
            }
            profile.locationUpdatedAt = new Date();
        }
    }

    if (input.phoneNumber !== undefined) {
        profile.phoneNumber = input.phoneNumber.trim();
    }

    await profile.save();

    // Update phone number and email on User model if provided
    let updatedUser = null;
    const userUpdates = {};
    if (input.phoneNumber !== undefined) {
        userUpdates.phoneNumber = input.phoneNumber.trim();
    }
    if (input.email !== undefined && input.email.trim()) {
        userUpdates.email = input.email.trim().toLowerCase();
    }
    if (Object.keys(userUpdates).length > 0) {
        updatedUser = await User.findByIdAndUpdate(userId, userUpdates, { returnDocument: 'after' });
    } else {
        updatedUser = await User.findById(userId);
    }

    const resObj = profile.toObject ? profile.toObject() : { ...profile };
    if (updatedUser) {
        resObj.phoneNumber = updatedUser.phoneNumber || '';
        resObj.email = updatedUser.email || '';
    }
    return resObj;
}
/**
 * Retrieve authenticated farmer's registered farm boundary polygon & area
 */
export async function getFarmerBoundary(userId) {
    const profile = await FarmerProfile.findOne({ userId }).select(
        '+farmBoundary +boundaryAreaAcres +boundaryUpdatedAt +latitude +longitude +farmSizeAcres'
    );
    if (!profile) {
        throw Object.assign(new Error('Farmer profile not found.'), { statusCode: 404 });
    }
    assertOwner({ userId, role: UserRole.FARMER }, profile.userId);

    const hasBoundary = Boolean(
        profile.farmBoundary &&
        Array.isArray(profile.farmBoundary.coordinates) &&
        profile.farmBoundary.coordinates.length > 0 &&
        profile.farmBoundary.coordinates[0].length >= 4
    );

    let centroid = null;
    if (hasBoundary && profile.farmBoundary.coordinates[0]?.length >= 3) {
        centroid = calculateCentroid(profile.farmBoundary.coordinates[0]);
    } else if (profile.longitude !== null && profile.longitude !== undefined && profile.latitude !== null && profile.latitude !== undefined) {
        centroid = [profile.longitude, profile.latitude];
    }

    return {
        hasBoundary,
        farmBoundary: hasBoundary ? profile.farmBoundary : null,
        boundaryAreaAcres: profile.boundaryAreaAcres ?? null,
        boundaryUpdatedAt: profile.boundaryUpdatedAt || null,
        farmSizeAcres: profile.farmSizeAcres ?? null,
        centroid,
        referenceCoordinates: {
            latitude: profile.latitude ?? null,
            longitude: profile.longitude ?? null,
        },
    };
}

/**
 * Register or update authenticated farmer's farm boundary polygon
 */
export async function updateFarmerBoundary(userId, input) {
    const profile = await FarmerProfile.findOne({ userId }).select(
        '+farmBoundary +boundaryAreaAcres +boundaryUpdatedAt +latitude +longitude +farmSizeAcres'
    );
    if (!profile) {
        throw Object.assign(new Error('Farmer profile not found.'), { statusCode: 404 });
    }
    assertOwner({ userId, role: UserRole.FARMER }, profile.userId);

    // Validate and normalize polygon input
    const normalized = validateAndNormalizePolygon(input);

    profile.farmBoundary = normalized.polygon;
    profile.boundaryAreaAcres = normalized.areaAcres;
    profile.boundaryUpdatedAt = new Date();

    // If farmer has no reference coordinates set, auto-seed with polygon centroid
    if (profile.latitude === undefined || profile.latitude === null || profile.longitude === undefined || profile.longitude === null) {
        if (normalized.centroid) {
            profile.longitude = normalized.centroid[0];
            profile.latitude = normalized.centroid[1];
            profile.locationUpdatedAt = new Date();
        }
    }

    if (input.phoneNumber !== undefined) {
        profile.phoneNumber = input.phoneNumber.trim();
    }

    await profile.save();

    return {
        hasBoundary: true,
        farmBoundary: profile.farmBoundary,
        boundaryAreaAcres: profile.boundaryAreaAcres,
        boundaryAreaHectares: normalized.areaHectares,
        centroid: normalized.centroid,
        boundaryUpdatedAt: profile.boundaryUpdatedAt,
        referenceCoordinates: {
            latitude: profile.latitude ?? null,
            longitude: profile.longitude ?? null,
        },
    };
}

/**
 * Remove or clear authenticated farmer's registered farm boundary polygon
 */
export async function clearFarmerBoundary(userId) {
    const profile = await FarmerProfile.findOne({ userId }).select(
        '+farmBoundary +boundaryAreaAcres +boundaryUpdatedAt'
    );
    if (!profile) {
        throw Object.assign(new Error('Farmer profile not found.'), { statusCode: 404 });
    }
    assertOwner({ userId, role: UserRole.FARMER }, profile.userId);

    profile.farmBoundary = undefined;
    profile.boundaryAreaAcres = undefined;
    profile.boundaryUpdatedAt = new Date();

    await profile.save();

    return {
        hasBoundary: false,
        farmBoundary: null,
        boundaryAreaAcres: null,
        boundaryUpdatedAt: profile.boundaryUpdatedAt,
    };
}

/**
 * Get public profile by farmer profile ID or user ID — strips private fields
 */
export async function getPublicFarmerProfile(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { userId: id }] } : { userId: id };
    // Explicitly exclude private location, GPS coordinates, and farm boundary polygon
    const profile = await FarmerProfile.findOne(query).select(
        '-__v -_privateExactLocation -latitude -longitude -locationUpdatedAt -farmBoundary -boundaryAreaAcres -boundaryUpdatedAt'
    );
    if (!profile) {
        throw Object.assign(new Error('Farmer profile not found.'), { statusCode: 404 });
    }
    if (!profile.isPublicProfile) {
        throw Object.assign(new Error('This profile is set to private.'), { statusCode: 403 });
    }
    const sanitized = profile.toObject();
    // Defense-in-depth: delete private coordinates & boundary from output
    delete sanitized._privateExactLocation;
    delete sanitized.latitude;
    delete sanitized.longitude;
    delete sanitized.locationUpdatedAt;
    delete sanitized.farmBoundary;
    delete sanitized.boundaryAreaAcres;
    delete sanitized.boundaryUpdatedAt;

    return sanitized;
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

// ── Smart Farm Advisor & Assistance Methods ─────────────────────────────────

/**
 * Generate AI-assisted farm health advisory for authenticated farmer
 * by combining Sentinel-2 NDVI calculation with Gemini AI agronomy advisor.
 */
export async function getFarmerAdvisory(userId, queryOptions = {}) {
    const profile = await FarmerProfile.findOne({ userId }).select(
        '+farmBoundary +boundaryAreaAcres +latitude +longitude +farmSizeAcres +phoneNumber'
    );
    if (!profile) {
        throw Object.assign(new Error('Farmer profile not found.'), { statusCode: 404 });
    }
    assertOwner({ userId, role: UserRole.FARMER }, profile.userId);

    const hasBoundary = Boolean(
        profile.farmBoundary &&
        Array.isArray(profile.farmBoundary.coordinates) &&
        profile.farmBoundary.coordinates.length > 0 &&
        profile.farmBoundary.coordinates[0].length >= 4
    );

    if (!hasBoundary) {
        throw Object.assign(
            new Error('Farm boundary polygon is required to calculate satellite NDVI and generate an advisory. Please draw your farm boundary first.'),
            { statusCode: 400, code: 'BOUNDARY_REQUIRED' }
        );
    }

    // Step 1: Calculate Sentinel-2 NDVI over the farm boundary
    const ndviResult = await calculateFarmNDVI({
        farmBoundary: profile.farmBoundary,
        maxCloudCoverPercent: queryOptions.maxCloudCover ? Number(queryOptions.maxCloudCover) : 20,
        startDate: queryOptions.startDate,
        endDate: queryOptions.endDate,
    });

    // Step 1b: Fetch weather data for the farm location (non-blocking)
    let weatherData = null;
    let weatherContext = null;
    try {
        weatherData = await getFarmWeather({
            latitude: profile.latitude,
            longitude: profile.longitude,
        });
        weatherContext = buildWeatherContext(weatherData);
    } catch (weatherErr) {
        console.warn('[FarmerService] Weather fetch failed (non-critical):', weatherErr.message);
    }

    // Step 2: Pass NDVI + weather results to Gemini AI Advisor
    // calculateFarmNDVI now returns a normalized flat shape: { success, meanNDVI, cloudCoverPercent, imageryDate, ... }
    const advisoryResult = await generateFarmAdvisory({
        ndviData: ndviResult,
        primaryCrops: profile.primaryCrops || [],
        county: profile.county || '',
        farmSizeAcres: profile.farmSizeAcres || profile.boundaryAreaAcres || null,
        weatherContext,
    });

    // Step 3: Persist NDVI observation to history (only when real data is available)
    if (ndviResult.success && ndviResult.meanNDVI !== null && Number.isFinite(ndviResult.meanNDVI)) {
        try {
            const ndvi = ndviResult.meanNDVI;
            const classification = classifyNDVI(ndvi);
            await FarmObservation.create({
                userId,
                observationDate: new Date(),
                meanNDVI: ndvi,
                vegetationLabel: classification.label,
                vegetationSeverity: classification.severity,
                cloudCoverPercent: ndviResult.cloudCoverPercent ?? null,
                farmAreaAcres: ndviResult.farmAreaAcres ?? null,
                dataset: ndviResult.dataset || ndviResult.source || 'SENTINEL2',
                source: ndviResult.source || 'LIVE',
            });
        } catch (saveErr) {
            console.error('[FarmerService] Failed to save NDVI observation to history:', saveErr.message);
        }
    }

    // If vegetation stress is detected (concern), dispatch an advisory notification
    if (
        advisoryResult.success &&
        advisoryResult.ndviClassification?.severity === 'concern'
    ) {
        try {
            await dispatchFarmerNotification({
                userId,
                phoneNumber: profile.phoneNumber || null,
                type: 'FARM_ADVISORY',
                title: 'Farm Health Observation Update',
                body: `Satellite observation indicates vegetation stress on your registered parcel (${advisoryResult.ndviClassification.label}). Review guidance on your dashboard.`,
                smsBody: `MavunoTrust: Satellite observation shows vegetation stress (${advisoryResult.ndviClassification.label}) on your farm. View recommendations on your dashboard.`,
                link: '/farmer/dashboard',
                meta: {
                    observationDate: advisoryResult.observationDate,
                    severity: advisoryResult.ndviClassification.severity,
                    label: advisoryResult.ndviClassification.label,
                },
            });
        } catch (notifErr) {
            console.error('[FarmerService] Failed to dispatch advisory alert:', notifErr.message);
        }
    }

    return { ...advisoryResult, weather: weatherData || null };
}

/**
 * Submit agricultural assistance referral request (e.g. One Acre Fund / Tupande)
 */
export async function submitAssistanceReferral(userId, input, ipAddress = '') {
    return requestAssistanceReferral({
        userId,
        organizationId: input.organizationId || 'TUPANDE_ONE_ACRE_FUND',
        assistanceType: input.assistanceType || 'INPUTS_AND_TRAINING',
        consentGiven: input.consentGiven,
        notes: input.notes || '',
        ipAddress,
        phoneNumber: input.phoneNumber || '',
    });
}

/**
 * List available agricultural assistance partners
 */
export function getAssistancePartners() {
    return listAssistancePartners();
}

/**
 * Update authenticated farmer's Firebase Cloud Messaging push token
 */
export async function updatePushToken(userId, fcmToken) {
    if (!fcmToken || typeof fcmToken !== 'string') {
        throw Object.assign(new Error('FCM token is required.'), { statusCode: 400 });
    }
    const user = await User.findByIdAndUpdate(
        userId,
        { fcmToken: fcmToken.trim() },
        { returnDocument: 'after' }
    ).select('fcmToken pushNotificationEnabled');

    if (!user) {
        throw Object.assign(new Error('User not found.'), { statusCode: 404 });
    }
    return { success: true, pushEnabled: user.pushNotificationEnabled };
}
