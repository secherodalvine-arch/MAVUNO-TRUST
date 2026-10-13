import DealerProfile from '../../models/DealerProfile.js';
import { escapeRegex } from '../../utils/escapeRegex.js';

export const findBuyers = async ({ crop, county, verificationStatus = 'ACTIVE', limit = 20 }) => {
  const query = { isPublicProfile: true };
  
  if (crop) {
    // Search cropsDealt array
    query.cropsDealt = { $regex: new RegExp(escapeRegex(crop), 'i') };
  }
  
  if (county) {
    // Search countiesServed array or generalOperatingArea
    query.$or = [
      { countiesServed: { $regex: new RegExp(escapeRegex(county), 'i') } },
      { generalOperatingArea: { $regex: new RegExp(escapeRegex(county), 'i') } }
    ];
  }

  if (verificationStatus) {
    query['licence.status'] = verificationStatus;
  }

  // Only public profile fields are selected; no user account data is loaded.
  const dealers = await DealerProfile.find(query)
    .select('displayName generalOperatingArea countiesServed cropsDealt purchasingCapacityKg licence.status licence.source isPublicProfile')
    .limit(limit)
    .lean();

  return dealers.map(d => {
    const status = d.licence?.status || 'UNKNOWN';
    const source = d.licence?.source || 'NOT_CHECKED';
    // Only an ACTIVE licence confirmed from the official AFA source counts as official verification.
    const isOfficiallyVerified = status === 'ACTIVE' && source === 'AFA_OFFICIAL';
    return {
      dealerId: d._id.toString(),
      displayName: d.displayName,
      generalOperatingArea: d.generalOperatingArea,
      countiesServed: d.countiesServed || [],
      cropsDealt: d.cropsDealt || [],
      purchasingCapacityKg: d.purchasingCapacityKg || null,
      verificationStatus: status,
      verificationSource: source,
      isOfficiallyVerified,
      verificationNote: isOfficiallyVerified
        ? 'Licence confirmed ACTIVE from official AFA source.'
        : source === 'AFA_DEMO'
          ? 'Demo AFA record only - NOT an official licence verification.'
          : 'Licence not confirmed from official AFA source.',
      isPublicProfile: d.isPublicProfile,
    };
  });
};

export const getDealerDetails = async ({ dealerId }) => {
  try {
    const dealer = await DealerProfile.findById(dealerId)
      .lean();

    if (!dealer || !dealer.isPublicProfile) {
      return { error: 'Dealer not found or profile is not public.' };
    }

    return {
      dealerId: dealer._id.toString(),
      displayName: dealer.displayName,
      bio: dealer.bio || null,
      generalOperatingArea: dealer.generalOperatingArea,
      countiesServed: dealer.countiesServed || [],
      cropsDealt: dealer.cropsDealt || [],
      purchasingCapacityKg: dealer.purchasingCapacityKg || null,
      verificationStatus: dealer.licence?.status || 'UNKNOWN',
      verificationSource: dealer.licence?.source || 'NOT_CHECKED',
      verifiedAt: dealer.licence?.verifiedAt ? dealer.licence.verifiedAt.toISOString() : null,
    };
  } catch (error) {
    return { error: 'Invalid dealer ID or database error.' };
  }
};
