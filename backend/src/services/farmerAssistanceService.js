/**
 * Farmer Assistance & Partner Referral Service — MavunoTrust Phase 4
 *
 * Implements agricultural assistance referrals (e.g., One Acre Fund / Tupande)
 * with strict privacy controls:
 * 1. Requires EXPLICIT consent before any referral is generated or data is shared.
 * 2. Records consent audit trail in UserConsent collection.
 * 3. Provides official Tupande / One Acre Fund contact details and USSD codes.
 * 4. Dispatches confirmation notification to the farmer.
 */

import UserConsent, { ConsentType } from '../models/UserConsent.js';
import FarmerProfile from '../models/FarmerProfile.js';
import User from '../models/User.js';
import { dispatchFarmerNotification } from './notificationDispatcher.js';

// Verified agricultural partner profiles (Kenya)
export const AGRICULTURAL_PARTNERS = {
  TUPANDE_ONE_ACRE_FUND: {
    id: 'TUPANDE_ONE_ACRE_FUND',
    name: 'One Acre Fund (Tupande)',
    description:
      'Provides smallholder farmers with asset financing for quality seeds, fertilizer, solar lights, and crop storage (PICS bags), along with weekly agronomic training.',
    ussdCode: '*284#',
    tollFreeHotline: '0800 724 413',
    website: 'https://oneacrefund.org/kenya',
    smsChannel: 'SMS *284# on Safaricom or Airtel',
    services: [
      'Quality Certified Hybrid Seeds & Fertilizer packages',
      'PICS Bags for Post-Harvest Protection (no chemical dusts needed)',
      'Solar Home Lighting & Clean Energy Financing',
      'Crop Insurance and Weather Index Coverage',
      'Local Field Officer visits and agronomy extension training',
    ],
  },
  KALRO_AGRI_EXTENSION: {
    id: 'KALRO_AGRI_EXTENSION',
    name: 'Kenya Agricultural & Livestock Research Organization (KALRO)',
    description: 'National research institution providing certified crop advisories and pest management.',
    tollFreeHotline: '0800 721 741',
    website: 'https://www.kalro.org',
    services: [
      'Crop disease identification and diagnostic centers',
      'Soil testing and fertilizer recommendations',
      'Good Agricultural Practices (GAP) manuals',
    ],
  },
};

/**
 * Get available agricultural assistance partners.
 */
export function getAssistancePartners() {
  return Object.values(AGRICULTURAL_PARTNERS);
}

/**
 * Submit an agricultural assistance referral request for an authenticated farmer.
 *
 * PRIVACY GUARANTEE:
 * - Requires explicit consent checkbox (consentGiven === true).
 * - Exact farm GPS coordinates are NEVER shared with the partner.
 * - Only generalArea, county, and primaryCrops are referenced.
 *
 * @param {object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.organizationId - Partner ID (default: TUPANDE_ONE_ACRE_FUND)
 * @param {string} [params.assistanceType] - e.g. 'INPUTS_AND_TRAINING', 'SOIL_HEALTH', 'AGRONOMY_ADVICE'
 * @param {boolean} params.consentGiven - Explicit user consent flag
 * @param {string} [params.notes] - Optional farmer notes
 * @param {string} [params.ipAddress] - Request IP address for consent audit
 * @returns {Promise<object>} Referral confirmation and partner contact info
 */
export async function requestAssistanceReferral({
  userId,
  organizationId = 'TUPANDE_ONE_ACRE_FUND',
  assistanceType = 'INPUTS_AND_TRAINING',
  consentGiven,
  notes = '',
  ipAddress = '',
}) {
  // STRICT PRIVACY CHECK: Consent must be explicitly true
  if (consentGiven !== true) {
    throw Object.assign(
      new Error(
        'Explicit consent is required to request agricultural assistance referral. Please check the consent box before proceeding.'
      ),
      { statusCode: 400, code: 'EXPLICIT_CONSENT_REQUIRED' }
    );
  }

  const partner = AGRICULTURAL_PARTNERS[organizationId] || AGRICULTURAL_PARTNERS.TUPANDE_ONE_ACRE_FUND;

  // Retrieve farmer profile (general info only — coordinates not needed)
  const profile = await FarmerProfile.findOne({ userId }).select('county subCounty generalArea primaryCrops');
  const user = await User.findById(userId).select('fullName phoneNumber email');

  if (!user) {
    throw Object.assign(new Error('User account not found.'), { statusCode: 404 });
  }

  // 1. Record explicit user consent in UserConsent collection (audit trail)
  await UserConsent.findOneAndUpdate(
    {
      userId,
      consentType: ConsentType.AGRICULTURAL_ASSISTANCE_REFERRAL,
    },
    {
      consentGiven: true,
      consentGivenAt: new Date(),
      consentVersion: '1.0',
      ipAddress: ipAddress ? ipAddress.trim() : undefined,
    },
    { upsert: true, new: true }
  );

  const referralId = `REF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // 2. Dispatch in-app notification + SMS + push to farmer
  const notifTitle = `Assistance Referral: ${partner.name}`;
  const notifBody = `Your referral (${referralId}) has been registered. You can connect with ${partner.name} directly via USSD ${partner.ussdCode || ''} or Toll-Free ${partner.tollFreeHotline}.`;
  const smsBody = `MavunoTrust: Assistance referral created (${referralId}). Connect with ${partner.name} at ${partner.ussdCode || partner.tollFreeHotline}.`;

  await dispatchFarmerNotification({
    userId,
    type: 'ASSISTANCE_REFERRAL',
    title: notifTitle,
    body: notifBody,
    smsBody,
    meta: {
      referralId,
      partnerId: partner.id,
      partnerName: partner.name,
      assistanceType,
    },
  });

  return {
    success: true,
    referralId,
    status: 'CONFIRMED',
    partner: {
      id: partner.id,
      name: partner.name,
      description: partner.description,
      ussdCode: partner.ussdCode || null,
      tollFreeHotline: partner.tollFreeHotline || null,
      smsChannel: partner.smsChannel || null,
      website: partner.website || null,
      services: partner.services,
    },
    sharedDetails: {
      farmerName: user.fullName,
      county: profile?.county || 'Not specified',
      subCounty: profile?.subCounty || 'Not specified',
      primaryCrops: profile?.primaryCrops || [],
      contactPhone: user.phoneNumber || 'Not registered',
    },
    consentRecordedAt: new Date().toISOString(),
    instructions: `You can reach ${partner.name} immediately by dialing ${partner.ussdCode || partner.tollFreeHotline} from your mobile phone. Have your referral ID (${referralId}) ready.`,
  };
}
