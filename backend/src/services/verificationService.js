/**
 * Verification Service — Step 6 & Security Hardening
 *
 * Implements provider abstraction, Demo AFA Verification Provider, and strict
 * verification ownership binding.
 *
 * CRITICAL SECURITY & COMPLIANCE RULES:
 *  1. LICENCE NUMBER ≠ VERIFICATION OWNERSHIP.
 *  2. Verification ownership is permanently bound to `req.user.userId` (from authenticated JWT token).
 *  3. Client-supplied `dealerUserId`, `status`, `source`, `verifiedAt` parameters are IGNORED/STRIPPED.
 *  4. A verification record belonging to Dealer A CANNOT be attached to, inherited by, or transferred to Dealer B.
 *  5. Copying a licence number creates a distinct verification check for Dealer B — Dealer A's audit record remains untouched.
 *  6. IDOR checks enforce that users can only view their own verification records (unless ADMIN).
 *  7. Audit events (`VERIFICATION_COMPLETED`) are logged for accountability.
 */
import DealerProfile, { VerificationStatus, VerificationSource } from '../models/DealerProfile.js';
import DealerVerification from '../models/DealerVerification.js';
import User, { UserRole } from '../models/User.js';
import AuditLog, { AuditAction, AuditResourceType } from '../models/AuditLog.js';
import { assertOwnerOrAdmin } from '../utils/authorizationUtils.js';
// ── Demo AFA Verification Provider ──────────────────────────────────────────
const DEMO_DISCLAIMER = 'Demonstration only — not a live AFA verification result.';
export class DemoAfaVerificationProvider {
    providerName = 'DEMO_AFA_VERIFICATION_PROVIDER';
    isDemoProvider = true;
    static demoDatabase = {
        'AFA-DEMO-001': {
            status: VerificationStatus.ACTIVE,
            source: VerificationSource.AFA_DEMO,
            isDemoData: true,
            licenceType: 'Cereal Dealer Licence',
            cropSector: 'Cereals & Grains',
            sourceReference: 'DEMO-REF-001-ACTIVE',
            notes: 'Demonstration record: Active licence registered under Demo AFA database.',
        },
        'AFA-DEMO-002': {
            status: VerificationStatus.EXPIRED,
            source: VerificationSource.AFA_DEMO,
            isDemoData: true,
            licenceType: 'Horticulture Buyer Licence',
            cropSector: 'Horticulture',
            sourceReference: 'DEMO-REF-002-EXPIRED',
            notes: 'Demonstration record: Licence expired on 2025-12-31.',
        },
        'AFA-DEMO-003': {
            status: VerificationStatus.SUSPENDED,
            source: VerificationSource.AFA_DEMO,
            isDemoData: true,
            licenceType: 'Produce Broker Licence',
            cropSector: 'General Agriculture',
            sourceReference: 'DEMO-REF-003-SUSPENDED',
            notes: 'Demonstration record: Licence suspended pending regulatory audit.',
        },
        'AFA-DEMO-004': {
            status: VerificationStatus.REVOKED,
            source: VerificationSource.AFA_DEMO,
            isDemoData: true,
            licenceType: 'Crop Trade Licence',
            cropSector: 'Cereals',
            sourceReference: 'DEMO-REF-004-REVOKED',
            notes: 'Demonstration record: Licence revoked due to non-compliance.',
        },
        'AFA-DEMO-005': {
            status: VerificationStatus.INACTIVE,
            source: VerificationSource.AFA_DEMO,
            isDemoData: true,
            licenceType: 'General Dealer Licence',
            cropSector: 'Pulses & Legumes',
            sourceReference: 'DEMO-REF-005-INACTIVE',
            notes: 'Demonstration record: Licence inactive — voluntary surrender.',
        },
        'AFA-DEMO-006': {
            status: VerificationStatus.UNABLE_TO_VERIFY,
            source: VerificationSource.AFA_DEMO,
            isDemoData: true,
            sourceReference: 'DEMO-REF-006-UNABLE',
            notes: 'Demonstration record: AFA system unable to locate active registry match.',
        },
    };
    async verifyLicence(licenceNumber) {
        const formatted = licenceNumber.trim().toUpperCase();
        const match = DemoAfaVerificationProvider.demoDatabase[formatted];
        if (match) {
            return {
                ...match,
                licenceNumber: formatted,
                checkedAt: new Date(),
                disclaimer: DEMO_DISCLAIMER,
            };
        }
        return {
            licenceNumber: formatted,
            status: VerificationStatus.UNABLE_TO_VERIFY,
            source: VerificationSource.AFA_DEMO,
            isDemoData: true,
            sourceReference: 'DEMO-REF-NOT-FOUND',
            notes: `Licence number ${formatted} not found in Demo AFA registry.`,
            checkedAt: new Date(),
            disclaimer: DEMO_DISCLAIMER,
        };
    }
}
// ── Not Configured Fallback Provider ──────────────────────────────────────────
export class NotConfiguredVerificationProvider {
    providerName = 'NOT_CONFIGURED';
    isDemoProvider = true;
    async verifyLicence(licenceNumber) {
        return {
            licenceNumber,
            status: VerificationStatus.UNABLE_TO_VERIFY,
            source: VerificationSource.NOT_CHECKED,
            isDemoData: true,
            checkedAt: new Date(),
            notes: 'No verification provider configured.',
            disclaimer: DEMO_DISCLAIMER,
        };
    }
}
// ── Active Provider Singleton ─────────────────────────────────────────────────
let _activeProvider = new DemoAfaVerificationProvider();
export function setVerificationProvider(provider) {
    _activeProvider = provider;
}
export function getVerificationProvider() {
    return _activeProvider;
}
// ── Verification Business Logic Service ────────────────────────────────────────
/**
 * Execute dealer licence verification for authenticated dealer.
 *
 * SECURITY:
 *  - `dealerUserId` MUST be derived from authenticated `req.user.userId`.
 *  - Client-supplied dealerUserId, status, or source inputs are completely ignored.
 *  - Creates an independent DealerVerification record bound to `dealerUserId`.
 */
export async function verifyDealerLicence(dealerUserId, licenceNumber) {
    if (!licenceNumber || !licenceNumber.trim()) {
        throw Object.assign(new Error('Licence number is required for verification.'), { statusCode: 400 });
    }
    const cleanLicenceNumber = licenceNumber.trim();
    const provider = getVerificationProvider();
    // Obtain verification result exclusively from active provider
    const result = await provider.verifyLicence(cleanLicenceNumber);
    // Retrieve dealer profile bound to authenticated user ID
    let profile = await DealerProfile.findOne({ userId: dealerUserId });
    if (!profile) {
        const user = await User.findById(dealerUserId);
        if (!user)
            throw Object.assign(new Error('Dealer user account not found.'), { statusCode: 404 });
        profile = await DealerProfile.create({
            userId: user._id,
            displayName: user.fullName,
        });
    }
    // Update authenticated dealer's profile with provider-evaluated metadata
    profile.licence = {
        licenceNumber: result.licenceNumber,
        licenceType: result.licenceType,
        cropSector: result.cropSector,
        status: result.status,
        source: result.source,
        verifiedAt: result.checkedAt,
        sourceReference: result.sourceReference,
        notes: result.notes,
    };
    await profile.save();
    // Create audit log record in DealerVerification bound to authenticated dealer ID
    const verificationRecord = await DealerVerification.create({
        dealerId: profile.userId, // Strictly bound to authenticated dealer's user ID
        licenceNumber: result.licenceNumber,
        licenceType: result.licenceType,
        cropSector: result.cropSector,
        status: result.status,
        source: result.source,
        checkedAt: result.checkedAt,
        issuedAt: result.issuedAt,
        expiresAt: result.expiresAt,
        sourceReference: result.sourceReference,
        notes: result.notes,
        checkedByUserId: profile.userId,
    });
    // Record audit log event for security investigation
    try {
        await AuditLog.create({
            actorId: profile.userId,
            actorRole: UserRole.DEALER,
            action: AuditAction.VERIFICATION_COMPLETED,
            resourceType: AuditResourceType.VERIFICATION,
            resourceId: verificationRecord._id.toString(),
            metadata: {
                licenceNumber: result.licenceNumber,
                status: result.status,
                source: result.source,
                isDemoData: result.isDemoData,
            },
        });
    }
    catch {
        // Audit logging failure should not break verification flow
    }
    return { result, profile, verificationRecord };
}
/**
 * Get a specific verification record by ID — protected by IDOR ownership check.
 */
export async function getVerificationById(authUserId, authRole, verificationId) {
    const verification = await DealerVerification.findById(verificationId);
    if (!verification) {
        throw Object.assign(new Error('Verification record not found.'), { statusCode: 404 });
    }
    // IDOR Protection: Ensure caller owns the record or is ADMIN
    assertOwnerOrAdmin({ userId: authUserId, role: authRole }, verification.dealerId);
    return verification;
}
/**
 * Get verification history for the authenticated dealer.
 */
export async function getMyVerificationHistory(dealerUserId) {
    return DealerVerification.find({ dealerId: dealerUserId }).sort({ checkedAt: -1 });
}
