import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { UserRole } from '../models/User.js';
import { getMyFarmerProfile, updateMyFarmerProfile, getPublicFarmerProfile, } from '../controllers/farmerController.js';
const router = Router();
// Public farmer profile lookup (data minimization applied)
router.get('/public/:id', getPublicFarmerProfile);
// Authenticated farmer routes
router.get('/me', requireAuth, requireRole(UserRole.FARMER), getMyFarmerProfile);
router.put('/me', requireAuth, requireRole(UserRole.FARMER), updateMyFarmerProfile);
export default router;
