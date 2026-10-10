import BuyerDemand, { DemandStatus } from '../models/BuyerDemand.js';
import FarmerCropListing from '../models/FarmerCropListing.js';
import User, { UserRole } from '../models/User.js';
import DealerProfile from '../models/DealerProfile.js';
import { assertOwner } from '../utils/authorizationUtils.js';
import { normalizeMarketPrice } from '../utils/unitNormalizer.js';

export async function createDemand(userId, input) {
    if (!input.quantity || input.quantity <= 0) {
        throw Object.assign(new Error('Quantity must be greater than 0.'), { statusCode: 400 });
    }
    if (!input.unit || !input.unit.trim()) {
        throw Object.assign(new Error('Unit is required.'), { statusCode: 400 });
    }

    const dealerProfile = await DealerProfile.findOne({ userId });
    
    const demand = await BuyerDemand.create({
        dealerId: userId,
        cropName: input.cropName?.trim() || 'General Produce',
        cropId: input.cropId,
        quantity: input.quantity,
        unit: input.unit.trim(),
        targetPricePerUnit: input.targetPricePerUnit,
        currency: input.currency || 'KES',
        desiredDeliveryDate: input.desiredDeliveryDate ? new Date(input.desiredDeliveryDate) : undefined,
        countiesServed: input.countiesServed || dealerProfile?.countiesServed || [],
        buyerReference: input.buyerReference?.trim(),
        status: DemandStatus.ACTIVE
    });
    return demand;
}

export async function getMyDemands(userId) {
    return BuyerDemand.find({ dealerId: userId }).sort({ createdAt: -1 });
}

export async function getDemandById(demandId) {
    const demand = await BuyerDemand.findById(demandId);
    if (!demand) {
        throw Object.assign(new Error('Buyer demand not found.'), { statusCode: 404 });
    }
    return demand;
}

export async function updateDemand(userId, demandId, input) {
    const demand = await getDemandById(demandId);
    assertOwner({ userId, role: UserRole.DEALER }, demand.dealerId);

    if (input.cropName !== undefined) demand.cropName = input.cropName.trim();
    if (input.quantity !== undefined) {
        if (input.quantity <= 0) throw Object.assign(new Error('Quantity must be greater than 0.'), { statusCode: 400 });
        demand.quantity = input.quantity;
    }
    if (input.unit !== undefined) demand.unit = input.unit.trim();
    if (input.targetPricePerUnit !== undefined) demand.targetPricePerUnit = input.targetPricePerUnit;
    if (input.desiredDeliveryDate !== undefined) demand.desiredDeliveryDate = input.desiredDeliveryDate ? new Date(input.desiredDeliveryDate) : undefined;
    if (input.countiesServed !== undefined) demand.countiesServed = input.countiesServed;
    if (input.buyerReference !== undefined) demand.buyerReference = input.buyerReference.trim();
    if (input.status !== undefined) demand.status = input.status;

    await demand.save();
    return demand;
}

export async function matchFarmerListingToDemands(listingId) {
    const listing = await FarmerCropListing.findById(listingId).populate('farmerId');
    if (!listing) {
        throw Object.assign(new Error('Farmer listing not found.'), { statusCode: 404 });
    }

    // Find active demands for similar crop
    const activeDemands = await BuyerDemand.find({
        status: DemandStatus.ACTIVE,
        $or: [
            { cropName: { $regex: new RegExp(listing.cropName, 'i') } },
            ...(listing.cropId ? [{ cropId: listing.cropId }] : [])
        ]
    }).populate('dealerId', 'fullName email phoneNumber');

    const matches = [];

    for (const demand of activeDemands) {
        let matchScore = 1; // Basic crop match
        const reasons = ['Crop name/type is compatible.'];
        const limitations = [];

        // 1. Check unit compatibility using unitNormalizer
        const normDemand = normalizeMarketPrice({ price: 1, unit: demand.unit });
        const normListing = normalizeMarketPrice({ price: 1, unit: listing.unit });

        let isUnitCompatible = false;
        let demandQtyInKg = null;
        let listingQtyInKg = null;

        if (demand.unit.toLowerCase() === listing.unit.toLowerCase()) {
            isUnitCompatible = true;
            reasons.push(`Units match perfectly (${demand.unit}).`);
        } else if (normDemand.normalizationStatus === 'SUCCESS' && normListing.normalizationStatus === 'SUCCESS') {
            isUnitCompatible = true;
            demandQtyInKg = demand.quantity / normDemand.normalizedPricePerKg; 
            listingQtyInKg = listing.estimatedQuantity / normListing.normalizedPricePerKg;
            reasons.push(`Units are convertible and compatible.`);
        } else {
            limitations.push(`Cannot directly compare units: demand wants '${demand.unit}', listing has '${listing.unit}'. Cannot silently convert bags to kilograms without explicit sizes.`);
        }

        // 2. Quantity check (only if units are compatible)
        if (isUnitCompatible) {
            const reqQty = demandQtyInKg || demand.quantity;
            const availQty = listingQtyInKg || listing.estimatedQuantity;
            
            if (availQty >= reqQty) {
                matchScore += 1;
                reasons.push(`Listing has sufficient quantity to fulfill demand.`);
            } else {
                limitations.push(`Listing quantity might not be enough (has ${availQty}, wants ${reqQty}).`);
            }
        }

        // 3. Area check
        if (listing.county && demand.countiesServed && demand.countiesServed.length > 0) {
            if (demand.countiesServed.includes(listing.county)) {
                matchScore += 1;
                reasons.push(`Dealer serves farmer's county (${listing.county}).`);
            } else {
                limitations.push(`Dealer does not explicitly serve farmer's county (${listing.county}).`);
            }
        }

        // 4. Date check
        if (demand.desiredDeliveryDate && listing.expectedSellingPeriodStart) {
            if (listing.expectedSellingPeriodStart <= demand.desiredDeliveryDate) {
                matchScore += 1;
                reasons.push(`Listing is available before or on the desired delivery date.`);
            } else {
                limitations.push(`Listing availability starts after the dealer's desired delivery date.`);
            }
        }

        matches.push({
            demand,
            matchScore,
            reasons,
            limitations
        });
    }

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return {
        listing,
        matches
    };
}
