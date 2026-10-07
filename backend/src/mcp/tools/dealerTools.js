import DealerProfile from '../../models/DealerProfile.js';

export const findBuyers = async ({ crop, county, verificationStatus = 'ACTIVE', limit = 20 }) => {
  const query = { isPublicProfile: true };
  
  if (crop) {
    // Search cropsDealt array
    query.cropsDealt = { $regex: new RegExp(crop, 'i') };
  }
  
  if (county) {
    // Search countiesServed array or generalOperatingArea
    query.$or = [
      { countiesServed: { $regex: new RegExp(county, 'i') } },
      { generalOperatingArea: { $regex: new RegExp(county, 'i') } }
    ];
  }

  if (verificationStatus) {
    query['licence.status'] = verificationStatus;
  }

  const dealers = await DealerProfile.find(query)
    .populate('userId', 'email') // only public safe info if any, actually email might be sensitive, we will not expose it
    .limit(limit)
    .lean();

  return dealers.map(d => ({
    dealerId: d._id.toString(),
    displayName: d.displayName,
    generalOperatingArea: d.generalOperatingArea,
    countiesServed: d.countiesServed || [],
    cropsDealt: d.cropsDealt || [],
    purchasingCapacityKg: d.purchasingCapacityKg || null,
    verificationStatus: d.licence?.status || 'UNKNOWN',
    verificationSource: d.licence?.source || 'NOT_CHECKED',
    isPublicProfile: d.isPublicProfile,
  }));
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
