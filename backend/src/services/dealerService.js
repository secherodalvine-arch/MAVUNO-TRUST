/**
 * Dealer Service — MavunoTrust Step 5
 *
 * Handles dealer profile management, purchasing capacity, crop interests,
 * and licence submission.
 *
 * LICENCE VERIFICATION INTEGRITY RULE:
 *  - Entering a licence number DOES NOT make the dealer verified!
 *  - The request body CANNOT set or alter `licence.status` or `licence.source`.
 *  - Status remains `PENDING` until evaluated by the Verification Service.
 */
import DealerProfile, { VerificationStatus, VerificationSource } from '../models/DealerProfile.js';
import User, { UserRole } from '../models/User.js';
import { assertOwner } from '../utils/authorizationUtils.js';
import mongoose from 'mongoose';
/**
 * Get or create profile for authenticated dealer
 */
export async function getDealerProfileByUserId(userId) {
    let profile = await DealerProfile.findOne({ userId });
    if (!profile) {
        const user = await User.findById(userId);
        if (!user)
            throw Object.assign(new Error('User not found.'), { statusCode: 404 });
        profile = await DealerProfile.create({
            userId: user._id,
            displayName: user.fullName,
            licence: {
                status: VerificationStatus.PENDING,
                source: VerificationSource.NOT_CHECKED,
            },
        });
    }
    return profile;
}
/**
 * Update authenticated dealer's profile
 */
export async function updateDealerProfile(userId, input) {
    const profile = await getDealerProfileByUserId(userId);
    // Ownership check
    assertOwner({ userId, role: UserRole.DEALER }, profile.userId);
    if (input.businessName !== undefined)
        profile.businessName = input.businessName.trim();
    if (input.displayName !== undefined)
        profile.displayName = input.displayName.trim();
    if (input.bio !== undefined)
        profile.bio = input.bio.trim();
    if (input.generalOperatingArea !== undefined)
        profile.generalOperatingArea = input.generalOperatingArea.trim();
    if (input.countiesServed !== undefined)
        profile.countiesServed = input.countiesServed;
    if (input.cropsDealt !== undefined)
        profile.cropsDealt = input.cropsDealt;
    if (input.purchasingCapacityKg !== undefined)
        profile.purchasingCapacityKg = input.purchasingCapacityKg;
    if (input.businessRegNumber !== undefined)
        profile.businessRegNumber = input.businessRegNumber.trim();
    if (input.isPublicProfile !== undefined)
        profile.isPublicProfile = input.isPublicProfile;
    // Licence submission check:
    // Capture licence identifier for future verification — explicitly PRESERVE status and source
    if (input.licenceNumber !== undefined) {
        profile.licence = {
            ...profile.licence,
            licenceNumber: input.licenceNumber.trim(),
            // Status remains PENDING/unverified — cannot be manually claimed by dealer!
            status: profile.licence?.status || VerificationStatus.PENDING,
            source: profile.licence?.source || VerificationSource.NOT_CHECKED,
        };
    }
    await profile.save();
    return profile;
}
/**
 * Get public dealer profile by profile ID or user ID
 */
export async function getPublicDealerProfile(id) {
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { $or: [{ _id: id }, { userId: id }] } : { userId: id };
    // Exclude sensitive business registration number
    const profile = await DealerProfile.findOne(query).select('-__v -businessRegNumber');
    if (!profile) {
        throw Object.assign(new Error('Dealer profile not found.'), { statusCode: 404 });
    }
    if (!profile.isPublicProfile) {
        throw Object.assign(new Error('This profile is set to private.'), { statusCode: 403 });
    }
    return profile.toObject();
}
/**
 * Get all active verified dealers for public search
 */
export async function getVerifiedDealers() {
    const dealers = await DealerProfile.find({
        'licence.status': VerificationStatus.ACTIVE,
        isPublicProfile: { $ne: false },
    }).select('-__v -businessRegNumber');
    return dealers.map(d => d.toObject());
}
