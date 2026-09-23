import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserRole } from '../models/User.js';
import { verifyDealerLicence, getVerificationRecordById, getMyVerificationHistory, } from '../controllers/verificationController.js';
const router = Router();
// Dealer verification execution
router.post('/dealer', requireAuth, requireRole(UserRole.DEALER), verifyDealerLicence);
// Dealer verification history (authenticated dealer only)
router.get('/history/my-history', requireAuth, requireRole(UserRole.DEALER), getMyVerificationHistory);
// Specific verification record lookup (IDOR protected: owner or admin only)
router.get('/record/:id', requireAuth, getVerificationRecordById);
export default router;
