import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import { requireRole } from '../middleware/requireRole';
import { UserRole } from '../models/User';
import {
  verifyDealerLicence,
  getVerificationRecordById,
  getMyVerificationHistory,
} from '../controllers/verificationController';

const router = Router();

// Dealer verification execution
router.post('/dealer', requireAuth, requireRole(UserRole.DEALER), verifyDealerLicence);

// Dealer verification history (authenticated dealer only)
router.get('/history/my-history', requireAuth, requireRole(UserRole.DEALER), getMyVerificationHistory);

// Specific verification record lookup (IDOR protected: owner or admin only)
router.get('/record/:id', requireAuth, getVerificationRecordById);

export default router;
