/**
 * Agricultural MCP Tools — MavunoTrust Model Context Protocol
 *
 * Implements core agricultural domain tools for AI agents and clients:
 * 1. get_market_prices: KAMIS reference commodity prices
 * 2. find_verified_dealers: AFA-verified dealers & buyers
 * 3. get_farm_profile: Authenticated farmer profile (sanitized, private coords stripped)
 * 4. get_farm_ndvi: Real Sentinel-2 satellite NDVI observations (no fabrication)
 * 5. get_farm_advisory: Gemini AI agricultural advisory (strict crop disease non-diagnosis disclaimer)
 * 6. find_farmer_assistance: Certified assistance partners (One Acre Fund / Tupande, KALRO)
 *
 * PRIVACY & SECURITY RULES:
 * - Never exposes exact GPS coordinates, raw polygons, or internal passwords/tokens.
 * - Enforces authentication and authorization.
 * - Handles errors gracefully with structured responses.
 */

import { getMarketPrices as fetchMarketPrices } from './marketTools.js';
import { findBuyers as fetchBuyers, getDealerDetails as fetchDealerDetails } from './dealerTools.js';
import * as farmerService from '../../services/farmerService.js';
import * as farmerAssistanceService from '../../services/farmerAssistanceService.js';
import * as satelliteService from '../../services/satelliteService.js';
import { generateFarmAdvisory } from '../../services/farmAdvisorService.js';
import FarmerProfile from '../../models/FarmerProfile.js';

/**
 * Retrieve agricultural market prices from KAMIS dataset.
 */
export async function getMarketPricesTool({ crop, county, market, limit = 50 }) {
  try {
    const prices = await fetchMarketPrices({ crop, county, market, limit });
    return {
      success: true,
      count: prices.length,
      prices,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to fetch market prices: ${err.message}`,
    };
  }
}

/**
 * Find AFA-verified dealers and crop buyers across Kenya.
 */
export async function findVerifiedDealersTool({ crop, county, verificationStatus = 'ACTIVE', limit = 20 }) {
  try {
    const dealers = await fetchBuyers({ crop, county, verificationStatus, limit });
    return {
      success: true,
      count: dealers.length,
      dealers,
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to find verified dealers: ${err.message}`,
    };
  }
}

/**
 * Retrieve farm profile for authenticated farmer or public farmer profile.
 *
 * PRIVACY GUARANTEE:
 * - Strips _privateExactLocation, latitude, longitude, and farmBoundary coordinates.
 */
export async function getFarmProfileTool({ user, farmerId }) {
  try {
    // If farmerId is specified and doesn't match authenticated user, return public profile
    if (farmerId && (!user || user.userId !== farmerId)) {
      const publicProfile = await farmerService.getPublicFarmerProfile(farmerId);
      return {
        success: true,
        type: 'PUBLIC_PROFILE',
        profile: publicProfile,
      };
    }

    // Require authentication for personal profile retrieval
    if (!user || !user.userId) {
      return {
        success: false,
        error: 'Authentication required to access personal farm profile.',
        code: 'AUTH_REQUIRED',
      };
    }

    const profile = await FarmerProfile.findOne({ userId: user.userId }).select(
      'displayName bio generalArea subCounty county farmSizeAcres primaryCrops estimatedAnnualYield yieldUnit expectedSellingPeriod isPublicProfile'
    ).lean();

    if (!profile) {
      return {
        success: false,
        error: 'Farmer profile not found for the authenticated user.',
        code: 'PROFILE_NOT_FOUND',
      };
    }

    // Check if farmer has registered coordinates or boundary without exposing the exact values
    const boundaryCheck = await FarmerProfile.findOne({ userId: user.userId })
      .select('+latitude +longitude +farmBoundary +boundaryAreaAcres')
      .lean();

    const hasCoordinates = Boolean(boundaryCheck?.latitude != null && boundaryCheck?.longitude != null);
    const hasBoundary = Boolean(boundaryCheck?.farmBoundary?.coordinates?.length > 0);

    return {
      success: true,
      type: 'AUTHENTICATED_FARMER_PROFILE',
      profile: {
        displayName: profile.displayName,
        bio: profile.bio || '',
        county: profile.county || '',
        subCounty: profile.subCounty || '',
        generalArea: profile.generalArea || '',
        farmSizeAcres: profile.farmSizeAcres ?? null,
        primaryCrops: profile.primaryCrops || [],
        estimatedAnnualYield: profile.estimatedAnnualYield ?? null,
        yieldUnit: profile.yieldUnit || '',
        expectedSellingPeriod: profile.expectedSellingPeriod || '',
        isPublicProfile: profile.isPublicProfile,
      },
      monitoringStatus: {
        hasRegisteredCoordinates,
        hasRegisteredBoundary: hasBoundary,
        boundaryAreaAcres: boundaryCheck?.boundaryAreaAcres ?? null,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to retrieve farm profile: ${err.message}`,
    };
  }
}

/**
 * Retrieve satellite NDVI observations over the farmer's registered parcel.
 * ZERO-FABRICATION RULE: Returns structured configuration status if GEE unconfigured.
 */
export async function getFarmNdviTool({ user, maxCloudCover = 20, startDate, endDate }) {
  if (!user || !user.userId) {
    return {
      success: false,
      error: 'Authentication required. Only registered farmers can query their satellite NDVI observations.',
      code: 'AUTH_REQUIRED',
    };
  }

  try {
    const boundaryData = await farmerService.getFarmerBoundary(user.userId);
    if (!boundaryData.hasBoundary || !boundaryData.farmBoundary) {
      return {
        success: false,
        code: 'BOUNDARY_REQUIRED',
        message: 'No farm boundary registered. Please draw your farm boundary polygon on your profile first.',
      };
    }

    const ndviResult = await satelliteService.calculateFarmNDVI({
      farmBoundary: boundaryData.farmBoundary,
      maxCloudCoverPercent: Number(maxCloudCover) || 20,
      startDate,
      endDate,
    });

    return ndviResult;
  } catch (err) {
    return {
      success: false,
      error: `Failed to compute farm NDVI: ${err.message}`,
      code: err.code || 'NDVI_ERROR',
    };
  }
}

/**
 * Generate AI agricultural advisory based on satellite observations and farmer crops.
 * STRICT DISCLAIMER: Never diagnoses crop diseases from satellite data alone.
 */
export async function getFarmAdvisoryTool({ user, maxCloudCover = 20, startDate, endDate }) {
  if (!user || !user.userId) {
    return {
      success: false,
      error: 'Authentication required. Only registered farmers can generate AI farm advisories.',
      code: 'AUTH_REQUIRED',
    };
  }

  try {
    const advisory = await farmerService.getFarmerAdvisory(user.userId, {
      maxCloudCover,
      startDate,
      endDate,
    });

    return advisory;
  } catch (err) {
    return {
      success: false,
      code: err.code || 'ADVISORY_ERROR',
      error: err.message,
    };
  }
}

/**
 * Find available agricultural assistance partners (e.g., One Acre Fund / Tupande).
 */
export async function findFarmerAssistanceTool({ category }) {
  try {
    const partners = farmerAssistanceService.getAssistancePartners();
    
    let filtered = partners;
    if (category) {
      const q = category.toLowerCase().trim();
      filtered = partners.filter(p => {
        const text = `${p.name} ${p.description} ${(p.services || []).join(' ')}`.toLowerCase();
        // Support common category synonyms
        if (q === 'inputs' || q === 'input') {
          return text.includes('seed') || text.includes('fertilizer') || text.includes('financing');
        }
        return text.includes(q);
      });
    }

    return {
      success: true,
      count: filtered.length,
      partners: filtered.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        ussdCode: p.ussdCode || null,
        tollFreeHotline: p.tollFreeHotline || null,
        services: p.services,
        website: p.website || null,
      })),
      instructions: 'Farmers can connect with One Acre Fund (Tupande) directly via USSD *284# or toll-free 0800 724 413. Explicit consent is required before referrals are submitted.',
    };
  } catch (err) {
    return {
      success: false,
      error: `Failed to find farmer assistance partners: ${err.message}`,
    };
  }
}
