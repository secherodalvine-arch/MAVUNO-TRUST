import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserRole } from '../models/User.js';
import { getMyDealerProfile, updateMyDealerProfile, getPublicDealerProfile, getVerifiedDealers, } from '../controllers/dealerController.js';
const router = Router();
// Public dealer list (search)
router.get('/public', requireAuth, getVerifiedDealers);
// Public dealer profile lookup (sensitive data stripped)
router.get('/public/:id', requireAuth, getPublicDealerProfile);
// Authenticated dealer routes
router.get('/me', requireAuth, requireRole(UserRole.DEALER), getMyDealerProfile);
router.put('/me', requireAuth, requireRole(UserRole.DEALER), updateMyDealerProfile);
export default router;
